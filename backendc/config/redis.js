const Redis = require('ioredis');

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  enableOfflineQueue: false,
});

redis.on('connect', () => {
  console.log('Redis connected successfully');
});

redis.on('error', (err) => {
  console.error('Redis connection error:', err);
});

// Cache helper functions
const cache = {
  // Set cache with optional TTL (in seconds)
  async set(key, value, ttl = 300) {
    try {
      const serialized = JSON.stringify(value);
      if (ttl) {
        await redis.setex(key, ttl, serialized);
      } else {
        await redis.set(key, serialized);
      }
      return true;
    } catch (err) {
      console.error('Cache set error:', err);
      return false;
    }
  },

  // Get from cache
  async get(key) {
    try {
      const data = await redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (err) {
      console.error('Cache get error:', err);
      return null;
    }
  },

  // Delete from cache
  async del(key) {
    try {
      await redis.del(key);
      return true;
    } catch (err) {
      console.error('Cache delete error:', err);
      return false;
    }
  },

  // Delete by pattern
  async delPattern(pattern) {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
      return true;
    } catch (err) {
      console.error('Cache pattern delete error:', err);
      return false;
    }
  },

  // Increment counter
  async incr(key) {
    try {
      return await redis.incr(key);
    } catch (err) {
      console.error('Cache incr error:', err);
      return null;
    }
  },

  // Get or set pattern
  async getOrSet(key, fetchFn, ttl = 300) {
    try {
      const cached = await this.get(key);
      if (cached) {
        return cached;
      }
      const data = await fetchFn();
      await this.set(key, data, ttl);
      return data;
    } catch (err) {
      console.error('Cache getOrSet error:', err);
      return await fetchFn();
    }
  }
};

module.exports = { redis, cache };
