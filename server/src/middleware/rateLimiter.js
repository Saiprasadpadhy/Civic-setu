import { AppError } from './errorHandler.js';

// In-memory sliding window rate limiter
class MemoryRateLimiter {
  constructor(windowMs, maxRequests, name = 'RateLimiter') {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    this.name = name;
    this.hits = new Map();

    // Periodic cleanup every 2 minutes
    this.cleanupInterval = setInterval(() => this.cleanup(), 2 * 60 * 1000);
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  cleanup() {
    const now = Date.now();
    for (const [key, timestamps] of this.hits.entries()) {
      const valid = timestamps.filter((t) => now - t < this.windowMs);
      if (valid.length === 0) {
        this.hits.delete(key);
      } else {
        this.hits.set(key, valid);
      }
    }
  }

  reset() {
    this.hits.clear();
  }

  middleware() {
    return (req, res, next) => {
      // In test mode, only enforce when explicitly testing rate limit
      if (process.env.NODE_ENV === 'test' && req.headers['x-test-rate-limit'] !== 'true') {
        return next();
      }

      const ip =
        req.ip ||
        req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
        req.socket?.remoteAddress ||
        '127.0.0.1';

      const now = Date.now();
      const windowStart = now - this.windowMs;

      let timestamps = this.hits.get(ip) || [];
      timestamps = timestamps.filter((t) => t > windowStart);

      if (timestamps.length >= this.maxRequests) {
        const oldestHit = timestamps[0];
        const retryAfterSec = Math.ceil((oldestHit + this.windowMs - now) / 1000);

        res.setHeader('Retry-After', String(Math.max(1, retryAfterSec)));
        res.setHeader('X-RateLimit-Limit', String(this.maxRequests));
        res.setHeader('X-RateLimit-Remaining', '0');
        res.setHeader('X-RateLimit-Reset', String(Math.ceil((oldestHit + this.windowMs) / 1000)));

        return next(
          new AppError('Too many requests, please try again later.', 429)
        );
      }

      timestamps.push(now);
      this.hits.set(ip, timestamps);

      const remaining = this.maxRequests - timestamps.length;
      res.setHeader('X-RateLimit-Limit', String(this.maxRequests));
      res.setHeader('X-RateLimit-Remaining', String(Math.max(0, remaining)));

      next();
    };
  }
}

// 1. Auth Rate Limiter: 15 login attempts per 15 minutes
export const authLimiter = new MemoryRateLimiter(
  15 * 60 * 1000,
  15,
  'AuthRateLimiter'
);

// 2. General API Rate Limiter: 500 requests per 1 minute
export const apiLimiter = new MemoryRateLimiter(
  60 * 1000,
  500,
  'GeneralApiRateLimiter'
);
