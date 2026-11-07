import { getKafka } from '../config/kafka.js';
import { TOPICS } from './eventProducer.js';
import { InventoryLockService } from '../services/inventoryLockService.js';

let consumer = null;

export const startInventoryConsumer = async () => {
  if (process.env.ENABLE_KAFKA_CONSUMERS !== 'true') {
    return; // Can be toggled on when Kafka is active
  }

  try {
    const kafka = getKafka();
    consumer = kafka.consumer({ groupId: 'shagunshopping-inventory-group' });

    await consumer.connect();
    await consumer.subscribe({ topic: TOPICS.PAYMENT_EVENTS, fromBeginning: false });
    await consumer.subscribe({ topic: TOPICS.ORDER_EVENTS, fromBeginning: false });

    console.log('[Kafka] Inventory consumer subscribed to topics');

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const raw = message.value?.toString();
          if (!raw) return;

          const { eventType, payload } = JSON.parse(raw);
          console.log(`[Kafka Consumer] Received ${eventType} on ${topic}`);

          switch (eventType) {
            case 'PAYMENT_CAPTURED':
              if (payload.orderId && payload.items) {
                await InventoryLockService.commitInventory(payload.orderId, payload.items);
                console.log(`[Kafka Consumer] Finalized inventory commit for order ${payload.orderId}`);
              }
              break;

            case 'PAYMENT_FAILED':
            case 'ORDER_CANCELLED':
              if (payload.orderId && payload.items) {
                await InventoryLockService.releaseInventory(payload.orderId, payload.items);
                console.log(`[Kafka Consumer] Released reserved inventory for order ${payload.orderId}`);
              }
              break;

            default:
              break;
          }
        } catch (err) {
          console.error('[Kafka Consumer] Processing error:', err.message);
        }
      },
    });
  } catch (err) {
    console.warn(`[Kafka Consumer] Failed to start consumer: ${err.message}`);
  }
};

