import { Kafka, logLevel } from 'kafkajs';

let kafka = null;
let producer = null;

export const getKafka = () => {
  if (kafka) return kafka;

  const brokers = (process.env.KAFKA_BROKERS || 'localhost:9092').split(',');

  kafka = new Kafka({
    clientId: process.env.KAFKA_CLIENT_ID || 'shagunshopping-backend',
    brokers,
    logLevel: logLevel.WARN,
    retry: {
      initialRetryTime: 300,
      retries: 5,
    },
  });

  return kafka;
};

export const getKafkaProducer = async () => {
  if (producer) return producer;

  const k = getKafka();
  producer = k.producer({
    allowAutoTopicCreation: true,
    transactionTimeout: 30000,
  });

  try {
    await producer.connect();
    console.log('[Kafka] Producer connected successfully');
  } catch (err) {
    console.warn(`[Kafka] Producer warning: ${err.message}`);
  }

  return producer;
};
