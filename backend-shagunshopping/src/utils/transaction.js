import mongoose from 'mongoose';

/**
 * Enterprise Multi-Document ACID Transaction Manager
 *
 * Guarantees all-or-nothing atomicity across multiple collections/documents:
 * - Automatically retries TransientTransactionErrors and UnknownTransactionCommitResults.
 * - Enforces writeConcern: { w: 'majority' } and readConcern: 'majority'.
 * - Gracefully falls back to session-less execution on standalone single-node MongoDB
 *   (e.g., in lightweight CI/local dev without a replica set).
 *
 * @param {Function} workFn Function to execute: (session) => Promise<T>
 * @param {Object} [options] Custom transaction options
 * @returns {Promise<T>} Result of the work function
 */
export const withTransaction = async (workFn, options = {}) => {
  // Check if active connection is ready
  if (mongoose.connection.readyState !== 1) {
    throw new Error('Database is not connected. Cannot initiate transaction.');
  }

  // Determine if MongoDB topology supports transactions (ReplicaSet or Sharded)
  const client = mongoose.connection.getClient();
  const topologyType = client?.topology?.description?.type;
  const isReplicaSet =
    topologyType === 'ReplicaSetWithPrimary' ||
    topologyType === 'ReplicaSetNoPrimary' ||
    topologyType === 'Sharded';

  // If not a replica set (e.g. standalone test server), execute without session
  if (!isReplicaSet) {
    return await workFn(null);
  }

  const session = await mongoose.startSession();
  try {
    const txnOptions = {
      readPreference: 'primary',
      readConcern: { level: 'majority' },
      writeConcern: { w: 'majority' },
      ...options,
    };

    let result;
    await session.withTransaction(async () => {
      result = await workFn(session);
    }, txnOptions);

    return result;
  } catch (err) {
    // If standalone replica set error 263 occurs, retry without session
    if (err.code === 263 || err.message?.includes('Transaction numbers are only allowed on a replica set')) {
      console.warn('[Transaction] Standalone MongoDB detected. Falling back to non-transactional execution.');
      return await workFn(null);
    }
    throw err;
  } finally {
    await session.endSession();
  }
};

export default withTransaction;
