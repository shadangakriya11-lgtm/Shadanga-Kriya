const { cache } = require('../config/redis.js');

// Cache middleware for GET requests
const cacheMiddleware = (ttl = 300) => async (req, res, next) => {
  // Skip caching for non-GET requests
  if (req.method !== 'GET') {
    return next();
  }

  // Create cache key from URL and user ID
  const userId = req.user?.userId || 'anonymous';
  const cacheKey = `api:${userId}:${req.originalUrl}`;

  try {
    const cachedData = await cache.get(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }

    // Store original res.json
    const originalJson = res.json.bind(res);
    
    // Override res.json to cache the response
    res.json = (data) => {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cache.set(cacheKey, data, ttl);
      }
      return originalJson(data);
    };

    next();
  } catch (err) {
    console.error('Cache middleware error:', err);
    next();
  }
};

// Invalidate cache middleware
const invalidateCache = (...patterns) => async (req, res, next) => {
  // Store original res.json
  const originalJson = res.json.bind(res);
  
  // Override res.json to invalidate cache after successful response
  res.json = async (data) => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      for (const pattern of patterns) {
        await cache.delPattern(pattern);
      }
    }
    return originalJson(data);
  };

  next();
};

module.exports = { cacheMiddleware, invalidateCache };
