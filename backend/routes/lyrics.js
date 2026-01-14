const express = require('express');
const router = express.Router();
const { cache } = require('../cache');

// Get lyrics for a song
router.get('/:trackId', (req, res) => {
  const { trackId } = req.params;
  
  // Check cache first
  const cachedLyrics = cache.get(trackId);
  if (cachedLyrics) {
    console.log(`[Lyrics] Cache hit for track: ${trackId}`);
    return res.json({
      trackId,
      lyrics: cachedLyrics,
      source: 'cache',
      cached: true
    });
  }
  
  // If not in cache, return empty response
  // The iOS app will need to send the lyrics to be cached
  console.log(`[Lyrics] Cache miss for track: ${trackId}`);
  res.status(404).json({
    error: 'Lyrics not found in cache',
    trackId,
    message: 'Please send lyrics from iOS app to cache them'
  });
});

// Store lyrics (sent from iOS app)
router.post('/', (req, res) => {
  const { trackId, artist, title, lyrics } = req.body;
  
  if (!trackId || !lyrics) {
    return res.status(400).json({
      error: 'Missing required fields',
      required: ['trackId', 'lyrics']
    });
  }
  
  // Store in cache
  const lyricsData = {
    trackId,
    artist: artist || 'Unknown Artist',
    title: title || 'Unknown Title',
    lyrics,
    timestamp: new Date().toISOString()
  };
  
  cache.set(trackId, lyricsData);
  
  console.log(`[Lyrics] Cached: ${artist} - ${title}`);
  
  res.json({
    success: true,
    message: 'Lyrics cached successfully',
    trackId
  });
});

// Update lyrics
router.put('/:trackId', (req, res) => {
  const { trackId } = req.params;
  const { artist, title, lyrics } = req.body;
  
  if (!lyrics) {
    return res.status(400).json({
      error: 'Missing lyrics field'
    });
  }
  
  const lyricsData = {
    trackId,
    artist: artist || 'Unknown Artist',
    title: title || 'Unknown Title',
    lyrics,
    timestamp: new Date().toISOString()
  };
  
  cache.set(trackId, lyricsData);
  
  console.log(`[Lyrics] Updated: ${artist} - ${title}`);
  
  res.json({
    success: true,
    message: 'Lyrics updated successfully',
    trackId
  });
});

// Delete lyrics from cache
router.delete('/:trackId', (req, res) => {
  const { trackId } = req.params;
  
  const deleted = cache.del(trackId);
  
  if (deleted > 0) {
    console.log(`[Lyrics] Deleted: ${trackId}`);
    res.json({
      success: true,
      message: 'Lyrics deleted from cache'
    });
  } else {
    res.status(404).json({
      error: 'Lyrics not found in cache'
    });
  }
});

// Search lyrics by artist or title
router.get('/search/:query', (req, res) => {
  const { query } = req.params;
  const allKeys = cache.keys();
  const results = [];
  
  allKeys.forEach(key => {
    const data = cache.get(key);
    if (data) {
      const searchString = `${data.artist} ${data.title}`.toLowerCase();
      if (searchString.includes(query.toLowerCase())) {
        results.push({
          trackId: data.trackId,
          artist: data.artist,
          title: data.title,
          timestamp: data.timestamp
        });
      }
    }
  });
  
  res.json({
    query,
    count: results.length,
    results
  });
});

module.exports = router;
