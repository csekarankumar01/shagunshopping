import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { correlationMiddleware, metrics } from '../src/middleware/correlation.js';

describe('Observability & Correlation Middleware', () => {
  it('should generate a new UUID correlation ID if not present in request', () => {
    const req = { headers: {} };
    let headerKey = '';
    let headerVal = '';
    const res = {
      setHeader: (k, v) => {
        headerKey = k;
        headerVal = v;
      },
      on: () => {},
    };

    let nextCalled = false;
    correlationMiddleware(req, res, () => {
      nextCalled = true;
    });

    assert.ok(nextCalled, 'next() must be called');
    assert.ok(req.id, 'req.id must be populated');
    assert.equal(headerKey, 'X-Request-Id');
    assert.equal(headerVal, req.id);
  });

  it('should propagate incoming X-Request-Id header without mutating it', () => {
    const incomingTraceId = 'trace-client-12345-abcde';
    const req = { headers: { 'x-request-id': incomingTraceId } };
    let attachedHeader = '';
    const res = {
      setHeader: (k, v) => {
        attachedHeader = v;
      },
      on: () => {},
    };

    correlationMiddleware(req, res, () => {});

    assert.equal(req.id, incomingTraceId);
    assert.equal(attachedHeader, incomingTraceId);
  });

  it('should track request metrics counters', () => {
    assert.ok(typeof metrics.requestsTotal === 'number');
    assert.ok(typeof metrics.totalResponseTimeMs === 'number');
    assert.ok(metrics.requestsByStatus['2xx'] !== undefined);
  });
});

