import crypto from 'node:crypto';

// In-memory Prometheus-compatible metrics counter
export const metrics = {
  requestsTotal: 0,
  requestsByStatus: {
    '2xx': 0,
    '3xx': 0,
    '4xx': 0,
    '5xx': 0,
  },
  totalResponseTimeMs: 0,
  startTime: Date.now(),
};

/**
 * Attaches a unique correlation ID to every incoming request
 * and tracks response timing for observability and telemetry.
 */
export const correlationMiddleware = (req, res, next) => {
  const requestId = req.headers['x-request-id'] || crypto.randomUUID();
  req.id = requestId;
  res.setHeader('X-Request-Id', requestId);

  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    metrics.requestsTotal++;
    metrics.totalResponseTimeMs += duration;

    const statusGroup = `${Math.floor(res.statusCode / 100)}xx`;
    if (metrics.requestsByStatus[statusGroup] !== undefined) {
      metrics.requestsByStatus[statusGroup]++;
    }

    // Structured logging for production observability
    if (process.env.NODE_ENV === 'production') {
      console.log(
        JSON.stringify({
          level: res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info',
          requestId,
          method: req.method,
          path: req.originalUrl || req.url,
          status: res.statusCode,
          durationMs: duration,
          timestamp: new Date().toISOString(),
        })
      );
    }
  });

  next();
};
