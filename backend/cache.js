const NodeCache = require('node-cache');

// Initialize cache with TTL from environment or default to 1 hour
const cacheTTL = parseInt(process.env.CACHE_TTL) || 3600;
const checkPeriod = parseInt(process.env.CACHE_CHECK_PERIOD) || 600;

const cache = new NodeCache({ 
  stdTTL: cacheTTL,
  checkperiod: checkPeriod,
  useClones: false
});

// Cache statistics
cache.on('set', (key, value) => {
  console.log(`[Cache] Set: ${key}`);
});

cache.on('expired', (key, value) => {
  console.log(`[Cache] Expired: ${key}`);
});

// Helper functions
const getCacheStats = () => {
  return {
    keys: cache.keys().length,
    hits: cache.getStats().hits,
    misses: cache.getStats().misses,
    ksize: cache.getStats().ksize,
    vsize: cache.getStats().vsize
  };
};

const clearCache = () => {
  cache.flushAll();
  console.log('[Cache] Cleared all cached data');
};

module.exports = {
  cache,
  getCacheStats,
  clearCache
};
