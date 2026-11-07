import { getKafkaProducer } from '../config/kafka.js';

export const TOPICS = {
  ORDER_EVENTS: 'shagunshopping.order.events',
  PAYMENT_EVENTS: 'shagunshopping.payment.events',
  INVENTORY_EVENTS: 'shagunshopping.inventory.events',
  NOTIFICATION_EVENTS: 'shagunshopping.notification.events',
};

/**
 * Publishes an event to a Kafka topic.
 * Fails safely if Kafka broker is unavailable in local development.
 */
export const publishDomainEvent = async (topic, eventType, key, payload) => {
  try {
    const producer = await getKafkaProducer();
    const message = {
      key: String(key),
      value: JSON.stringify({
        eventType,
        timestamp: new Date().toISOString(),
        payload,
      }),
      headers: {
        'event-type': eventType,
        'source-service': 'shagunshopping-backend',
      },
    };

    await producer.send({
      topic,
      messages: [message],
    });

    console.log(`[Kafka] Emitted ${eventType} to ${topic} (Key: ${key})`);
  } catch (err) {
    console.warn(`[Kafka] Could not emit ${eventType}: ${err.message}`);
  }
};

