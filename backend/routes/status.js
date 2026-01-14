const express = require('express');
const router = express.Router();
const os = require('os');
const { cache, getCacheStats, clearCache } = require('../cache');

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// System status endpoint
router.get('/', (req, res) => {
  const networkInterfaces = os.networkInterfaces();
  const addresses = [];
  
  // Get all IP addresses
  Object.keys(networkInterfaces).forEach(interfaceName => {
    networkInterfaces[interfaceName].forEach(interface => {
      if (interface.family === 'IPv4' && !interface.internal) {
        addresses.push({
          interface: interfaceName,
          address: interface.address
        });
      }
    });
  });
  
  res.json({
    status: 'running',
    uptime: process.uptime(),
    version: require('../../package.json').version,
    environment: process.env.NODE_ENV || 'development',
    system: {
      platform: os.platform(),
      arch: os.arch(),
      hostname: os.hostname(),
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem()
      },
      cpus: os.cpus().length
    },
    network: {
      addresses,
      configuredIP: process.env.PI_IP || 'Not set'
    },
    cache: getCacheStats(),
    timestamp: new Date().toISOString()
  });
});

// Cache statistics endpoint
router.get('/cache', (req, res) => {
  const stats = getCacheStats();
  const allKeys = cache.keys();
  const cachedSongs = [];
  
  allKeys.forEach(key => {
    const data = cache.get(key);
    if (data) {
      cachedSongs.push({
        trackId: data.trackId,
        artist: data.artist,
        title: data.title,
        timestamp: data.timestamp
      });
    }
  });
  
  res.json({
    statistics: stats,
    count: cachedSongs.length,
    songs: cachedSongs
  });
});

// Clear cache endpoint (use with caution)
router.post('/cache/clear', (req, res) => {
  clearCache();
  res.json({
    success: true,
    message: 'Cache cleared successfully'
  });
});

module.exports = router;
