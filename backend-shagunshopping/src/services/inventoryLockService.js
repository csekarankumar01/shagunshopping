import { getRedisClient, isRedisReady } from '../config/redis.js';
import Product from '../models/Product.js';

// Lua script for atomic stock reservation (Soft-Lock with TTL)
// Returns 1 if reservation succeeded, 0 if out of stock
const RESERVE_LUA = `
local stock_key = KEYS[1]
local reservation_key = KEYS[2]
local req_qty = tonumber(ARGV[1])
local ttl_seconds = tonumber(ARGV[2])

local current_stock = tonumber(redis.call('get', stock_key) or '-1')

-- If stock is not initialized in Redis, return -1 so application seeds it from DB
if current_stock == -1 then
    return -1
end

if current_stock >= req_qty then
    redis.call('decrby', stock_key, req_qty)
    redis.call('set', reservation_key, req_qty, 'EX', ttl_seconds)
    return 1
else
    return 0
end
`;

// Lua script to release a reservation (Compensating action on abort/timeout)
const RELEASE_LUA = `
local stock_key = KEYS[1]
local reservation_key = KEYS[2]

local held_qty = tonumber(redis.call('get', reservation_key) or '0')
if held_qty > 0 then
    redis.call('incrby', stock_key, held_qty)
    redis.call('del', reservation_key)
    return held_qty
end
return 0
`;

// Lua script to commit a reservation on payment confirmation
const COMMIT_LUA = `
local reservation_key = KEYS[1]
redis.call('del', reservation_key)
return 1
`;

export class InventoryLockService {
  static getStockKey(productId) {
    return `inventory:stock:${productId}`;
  }

  static getReservationKey(orderId, productId) {
    return `inventory:reservation:${orderId}:${productId}`;
  }

  /**
   * Syncs current MongoDB stock for a product into Redis.
   */
  static async syncStock(productId) {
    const redis = getRedisClient();
    const product = await Product.findById(productId).select('stock isActive');
    if (!product || !product.isActive) {
      await redis.set(this.getStockKey(productId), 0);
      return 0;
    }
    await redis.set(this.getStockKey(productId), product.stock);
    return product.stock;
  }

  /**
   * Attempts to atomically reserve stock for an entire cart of items.
   * If any item is out of stock, all previously reserved items in this call are
   * instantly rolled back, guaranteeing all-or-nothing atomicity.
   * 
   * @param {string} orderId Unique order ID / checkout intent ID
   * @param {Array<{ product: string, qty: number }>} items List of items and quantities
   * @param {number} ttlSeconds Hold duration (default 10 minutes = 600s)
   * @returns {Promise<{ success: boolean, failedProduct?: string, reason?: string }>}
   */
  static async reserveInventory(orderId, items, ttlSeconds = 600) {
    const ready = await isRedisReady();
    if (!ready) {
      // Graceful fallback to MongoDB atomic filtered write if Redis is unavailable
      return this.fallbackMongoReserve(items);
    }

    const redis = getRedisClient();
    const successfulReservations = [];

    for (const item of items) {
      const pId = String(item.product);
      const stockKey = this.getStockKey(pId);
      const resKey = this.getReservationKey(orderId, pId);

      let result = await redis.eval(RESERVE_LUA, 2, stockKey, resKey, item.qty, ttlSeconds);

      // If Redis key is cold (unseeded), sync from Mongo and retry once
      if (result === -1) {
        await this.syncStock(pId);
        result = await redis.eval(RESERVE_LUA, 2, stockKey, resKey, item.qty, ttlSeconds);
      }

      if (result === 1) {
        successfulReservations.push(item);
      } else {
        // STOCK RACE DETECTED!
        // Another customer just claimed the last product.
        // Rollback any items reserved earlier in this cart transaction:
        await this.releaseInventory(orderId, successfulReservations);

        return {
          success: false,
          failedProduct: pId,
          reason: 'Item is currently reserved by another customer or out of stock.',
        };
      }
    }

    return { success: true };
  }

  /**
   * Releases reserved stock back to the available pool (used when customer cancels,
   * leaves checkout, or payment fails).
   */
  static async releaseInventory(orderId, items) {
    const ready = await isRedisReady();
    if (!ready) return;

    const redis = getRedisClient();
    for (const item of items) {
      const pId = String(item.product);
      const stockKey = this.getStockKey(pId);
      const resKey = this.getReservationKey(orderId, pId);

      await redis.eval(RELEASE_LUA, 2, stockKey, resKey);
    }
  }

  /**
   * Commits the reservation once payment has been captured.
   * Removes temporary reservation keys and decrements the permanent MongoDB record.
   */
  static async commitInventory(orderId, items) {
    const ready = await isRedisReady();
    if (ready) {
      const redis = getRedisClient();
      for (const item of items) {
        const pId = String(item.product);
        const resKey = this.getReservationKey(orderId, pId);
        await redis.eval(COMMIT_LUA, 1, resKey);
      }
    }

    // Persist deduction in primary MongoDB
    const ops = items.map((it) => ({
      updateOne: {
        filter: { _id: it.product },
        update: { $inc: { stock: -it.qty } },
      },
    }));
    await Product.bulkWrite(ops);
  }

  /** Fallback for when Redis is disabled or unreachable */
  static async fallbackMongoReserve(items) {
    const ops = items.map((it) => ({
      updateOne: {
        filter: { _id: it.product, stock: { $gte: it.qty } },
        update: { $inc: { stock: -it.qty } },
      },
    }));
    const result = await Product.bulkWrite(ops);
    const ok = result.modifiedCount === items.length;
    if (!ok && result.modifiedCount > 0) {
      // Revert partial decrements
      await Product.bulkWrite(
        items.slice(0, result.modifiedCount).map((it) => ({
          updateOne: { filter: { _id: it.product }, update: { $inc: { stock: it.qty } } },
        }))
      );
    }
    return { success: ok };
  }
}

