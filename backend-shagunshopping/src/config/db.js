import mongoose from 'mongoose';

/**
 * Enterprise Production Connection Options for MongoDB Atlas & Replica Sets
 * - maxPoolSize: Capped to prevent exhausting Atlas connection tier limits when scaled across pods
 * - minPoolSize: Pre-warms sockets to eliminate connection latency spikes during flash sales
 * - serverSelectionTimeoutMS: Fails fast (5s) instead of hanging requests for 30s during primary failovers
 * - socketTimeoutMS: Kills dead TCP sockets that hung indefinitely
 * - retryWrites: Transparently retries idempotent write failures
 * - w: 'majority': Demands write acknowledgment from majority of replica set nodes before success
 */
const MONGO_OPTIONS = {
  maxPoolSize: Number(process.env.MONGO_MAX_POOL_SIZE) || 50,
  minPoolSize: Number(process.env.MONGO_MIN_POOL_SIZE) || 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  heartbeatFrequencyMS: 10000,
  retryWrites: true,
  w: 'majority',
  readPreference: 'primaryPreferred',
  autoIndex: process.env.NODE_ENV !== 'production', // Don't block production boot with foreground index builds
};

let isConnected = false;

export const connectDB = async () => {
  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('FATAL: MONGO_URI environment variable is not defined.');
    process.exit(1);
  }

  // Setup connection event lifecycle observers
  mongoose.connection.on('connected', () => {
    isConnected = true;
    console.log(`[Database] MongoDB connection established: ${mongoose.connection.host}/${mongoose.connection.name}`);
  });

  mongoose.connection.on('error', (err) => {
    console.error(`[Database Error] MongoDB connection error: ${err.message}`, { error: err });
  });

  mongoose.connection.on('disconnected', () => {
    isConnected = false;
    console.warn('[Database Warning] MongoDB disconnected. Reconnect attempt will occur automatically...');
  });

  mongoose.connection.on('reconnected', () => {
    isConnected = true;
    console.log('[Database] MongoDB reconnected successfully.');
  });

  try {
    const conn = await mongoose.connect(uri, MONGO_OPTIONS);
    isConnected = true;
    console.log(`[Database] MongoDB connected: ${conn.connection.host} (Pool: min=${MONGO_OPTIONS.minPoolSize}, max=${MONGO_OPTIONS.maxPoolSize})`);
    return conn;
  } catch (err) {
    console.error(`[Database Fatal] Initial MongoDB connection failed: ${err.message}`);
    process.exit(1);
  }
};

/**
 * Diagnostic Health Probe for Kubernetes Readiness / Liveness & Admin Monitoring
 */
export const checkDatabaseHealth = async () => {
  const stateMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  const status = stateMap[mongoose.connection.readyState] || 'unknown';
  if (mongoose.connection.readyState !== 1) {
    return {
      status,
      healthy: false,
      latencyMs: -1,
      database: mongoose.connection.name || 'unconnected',
    };
  }

  const start = Date.now();
  try {
    await mongoose.connection.db.admin().ping();
    const latencyMs = Date.now() - start;
    return {
      status: 'connected',
      healthy: true,
      latencyMs,
      database: mongoose.connection.name,
      host: mongoose.connection.host,
    };
  } catch (err) {
    return {
      status: 'degraded',
      healthy: false,
      latencyMs: Date.now() - start,
      error: err.message,
    };
  }
};

/**
 * Graceful teardown of connection pool on application termination (SIGINT / SIGTERM)
 */
export const closeDatabaseConnection = async () => {
  if (mongoose.connection.readyState !== 0) {
    console.log('[Database] Closing MongoDB connection pool cleanly...');
    await mongoose.connection.close(false);
    console.log('[Database] MongoDB connection pool drained and closed.');
  }
};

export default connectDB;
