import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import Order, { ALLOWED_STATUS_TRANSITIONS } from '../src/models/Order.js';

describe('Order Schema & State Machine Invariants', () => {
  it('should define strictly validated legal status transitions', () => {
    assert.deepEqual(ALLOWED_STATUS_TRANSITIONS.pending_payment, ['processing', 'cancelled']);
    assert.deepEqual(ALLOWED_STATUS_TRANSITIONS.processing, ['shipped', 'cancelled']);
    assert.deepEqual(ALLOWED_STATUS_TRANSITIONS.shipped, ['delivered', 'cancelled']);
    assert.deepEqual(ALLOWED_STATUS_TRANSITIONS.delivered, []);
    assert.deepEqual(ALLOWED_STATUS_TRANSITIONS.cancelled, []);
  });

  it('should reject an order with zero items', () => {
    const order = new Order({
      user: '60d0fe4f5311236168a109ca',
      orderItems: [],
      shippingAddress: {
        fullName: 'Test Customer',
        phone: '9876543210',
        line1: '123 Market St',
        city: 'Meerut',
        state: 'UP',
        pincode: '250001',
      },
      paymentMethod: 'cod',
      itemsPrice: 1000,
      shippingPrice: 49,
      totalPrice: 1049,
      status: 'processing',
    });

    const error = order.validateSync();
    assert.ok(error, 'Should have failed validation');
    assert.ok(error.errors.orderItems, 'Expected validation error on orderItems');
  });

  it('should validate positive item quantities', () => {
    const order = new Order({
      user: '60d0fe4f5311236168a109ca',
      orderItems: [
        {
          product: '60d0fe4f5311236168a109cb',
          name: 'Rose Water Toner',
          brand: 'Kama',
          price: 499,
          mrp: 599,
          qty: 0, // Invalid: min is 1
        },
      ],
      shippingAddress: {
        fullName: 'Test Customer',
        phone: '9876543210',
        line1: '123 Market St',
        city: 'Meerut',
        state: 'UP',
        pincode: '250001',
      },
      paymentMethod: 'cod',
      itemsPrice: 499,
      shippingPrice: 49,
      totalPrice: 548,
    });

    const error = order.validateSync();
    assert.ok(error, 'Should fail validation when item quantity is 0');
    assert.ok(error.errors['orderItems.0.qty'], 'Expected error on item quantity');
  });

  it('should reject when totalPrice does not match itemsPrice + shippingPrice + codFee', (t, done) => {
    const order = new Order({
      user: '60d0fe4f5311236168a109ca',
      orderItems: [
        {
          product: '60d0fe4f5311236168a109cb',
          name: 'Rose Water Toner',
          brand: 'Kama',
          price: 500,
          mrp: 600,
          qty: 1,
        },
      ],
      shippingAddress: {
        fullName: 'Test Customer',
        phone: '9876543210',
        line1: '123 Market St',
        city: 'Meerut',
        state: 'UP',
        pincode: '250001',
      },
      paymentMethod: 'cod',
      itemsPrice: 500,
      shippingPrice: 49,
      codFee: 0,
      totalPrice: 9999, // Intentional arithmetic mismatch
      status: 'processing',
    });

    // Invoke pre-save hook
    order.save().catch((err) => {
      assert.ok(err, 'Expected pre-save invariant rejection');
      assert.match(err.message, /Financial invariant violation/);
      done();
    });
  });
});

