const NodeCache = require('node-cache');

// Create cache instance with 5 minutes default TTL
const cache = new NodeCache({ 
  stdTTL: 300, // 5 minutes
  checkperiod: 600, // Check for expired keys every 10 minutes
  useClones: false // Better performance
});

// Cache middleware
const cacheMiddleware = (duration = 300) => {
  return (req, res, next) => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Create cache key based on URL and query parameters
    const key = `${req.originalUrl || req.url}`;
    
    // Check if data exists in cache
    const cachedData = cache.get(key);
    if (cachedData) {
      return res.json(cachedData);
    }

    // Store original send function
    const originalSend = res.json;

    // Override send function to cache the response
    res.json = function(data) {
      // Cache the response
      cache.set(key, data, duration);
      
      // Call original send function
      return originalSend.call(this, data);
    };

    next();
  };
};

// Clear cache for specific patterns
const clearCache = (pattern) => {
  const keys = cache.keys();
  const matchingKeys = keys.filter(key => key.includes(pattern));
  cache.del(matchingKeys);
};

// Clear all cache
const clearAllCache = () => {
  cache.flushAll();
};

// Get cache stats
const getCacheStats = () => {
  return cache.getStats();
};

module.exports = {
  cacheMiddleware,
  clearCache,
  clearAllCache,
  getCacheStats,
  cache
}; 