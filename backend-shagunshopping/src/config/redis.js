import Redis from 'ioredis';

let redisClient = null;

export const getRedisClient = () => {
  if (redisClient) return redisClient;

  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

  redisClient = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    retryStrategy(times) {
      const delay = Math.min(times * 200, 2000);
      return delay;
    },
    lazyConnect: true,
  });

  redisClient.on('connect', () => {
    console.log('[Redis] Connected successfully');
  });

  redisClient.on('error', (err) => {
    // Prevent unhandled error crashing if Redis is not yet booted in dev
    console.warn(`[Redis] Connection warning: ${err.message}`);
  });

  return redisClient;
};

export const isRedisReady = async () => {
  try {
    const client = getRedisClient();
    if (client.status === 'ready') return true;
    if (client.status === 'wait') {
      await client.connect();
      return true;
    }
    return client.status === 'ready' || client.status === 'connecting';
  } catch {
    return false;
  }
};

