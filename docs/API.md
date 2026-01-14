# Teslyrics API Documentation

## Base URL

```
http://<raspberry-pi-ip>:3000/api
```

Default: `http://192.168.4.1:3000/api` (when using WiFi hotspot)

## Authentication

Currently, no authentication is required. All endpoints are open.

> **Note**: For production use, consider implementing API key authentication.

---

## Endpoints

### Health Check

Check if the server is running.

**Endpoint:** `GET /status/health`

**Response:**
```json
{
  "status": "healthy",
  "uptime": 3600.5,
  "timestamp": "2024-01-14T12:00:00.000Z"
}
```

---

### System Status

Get detailed system information.

**Endpoint:** `GET /status`

**Response:**
```json
{
  "status": "running",
  "uptime": 3600.5,
  "version": "1.0.0",
  "environment": "production",
  "system": {
    "platform": "linux",
    "arch": "arm",
    "hostname": "raspberrypi",
    "memory": {
      "total": 1073741824,
      "free": 536870912,
      "used": 536870912
    },
    "cpus": 4
  },
  "network": {
    "addresses": [
      {
        "interface": "wlan0",
        "address": "192.168.4.1"
      }
    ],
    "configuredIP": "192.168.4.1"
  },
  "cache": {
    "keys": 15,
    "hits": 120,
    "misses": 8,
    "ksize": 15360,
    "vsize": 245000
  },
  "timestamp": "2024-01-14T12:00:00.000Z"
}
```

---

### Cache Statistics

Get cache statistics and list of cached songs.

**Endpoint:** `GET /status/cache`

**Response:**
```json
{
  "statistics": {
    "keys": 15,
    "hits": 120,
    "misses": 8,
    "ksize": 15360,
    "vsize": 245000
  },
  "count": 15,
  "songs": [
    {
      "trackId": "track123",
      "artist": "Artist Name",
      "title": "Song Title",
      "timestamp": "2024-01-14T12:00:00.000Z"
    }
  ]
}
```

---

### Clear Cache

Clear all cached lyrics.

**Endpoint:** `POST /status/cache/clear`

**Response:**
```json
{
  "success": true,
  "message": "Cache cleared successfully"
}
```

---

### Get Lyrics

Retrieve lyrics for a specific track.

**Endpoint:** `GET /lyrics/:trackId`

**Parameters:**
- `trackId` (string, required) - Unique identifier for the track

**Success Response (200):**
```json
{
  "trackId": "track123",
  "lyrics": {
    "trackId": "track123",
    "artist": "Artist Name",
    "title": "Song Title",
    "lyrics": "Line 1\nLine 2\nLine 3",
    "timestamp": "2024-01-14T12:00:00.000Z"
  },
  "source": "cache",
  "cached": true
}
```

**Error Response (404):**
```json
{
  "error": "Lyrics not found in cache",
  "trackId": "track123",
  "message": "Please send lyrics from iOS app to cache them"
}
```

---

### Store Lyrics

Store lyrics sent from the iOS app.

**Endpoint:** `POST /lyrics`

**Request Body:**
```json
{
  "trackId": "track123",
  "artist": "Artist Name",
  "title": "Song Title",
  "lyrics": "Line 1\nLine 2\nLine 3"
}
```

**Required Fields:**
- `trackId` (string) - Unique identifier for the track
- `lyrics` (string) - Lyrics text

**Optional Fields:**
- `artist` (string) - Artist name (defaults to "Unknown Artist")
- `title` (string) - Song title (defaults to "Unknown Title")

**Success Response (200):**
```json
{
  "success": true,
  "message": "Lyrics cached successfully",
  "trackId": "track123"
}
```

**Error Response (400):**
```json
{
  "error": "Missing required fields",
  "required": ["trackId", "lyrics"]
}
```

---

### Update Lyrics

Update existing lyrics for a track.

**Endpoint:** `PUT /lyrics/:trackId`

**Parameters:**
- `trackId` (string, required) - Unique identifier for the track

**Request Body:**
```json
{
  "artist": "Updated Artist",
  "title": "Updated Title",
  "lyrics": "Updated lyrics content"
}
```

**Required Fields:**
- `lyrics` (string) - Updated lyrics text

**Success Response (200):**
```json
{
  "success": true,
  "message": "Lyrics updated successfully",
  "trackId": "track123"
}
```

**Error Response (400):**
```json
{
  "error": "Missing lyrics field"
}
```

---

### Delete Lyrics

Remove lyrics from cache.

**Endpoint:** `DELETE /lyrics/:trackId`

**Parameters:**
- `trackId` (string, required) - Unique identifier for the track

**Success Response (200):**
```json
{
  "success": true,
  "message": "Lyrics deleted from cache"
}
```

**Error Response (404):**
```json
{
  "error": "Lyrics not found in cache"
}
```

---

### Search Lyrics

Search for lyrics by artist or title.

**Endpoint:** `GET /lyrics/search/:query`

**Parameters:**
- `query` (string, required) - Search query

**Response:**
```json
{
  "query": "artist",
  "count": 3,
  "results": [
    {
      "trackId": "track123",
      "artist": "Artist Name",
      "title": "Song Title",
      "timestamp": "2024-01-14T12:00:00.000Z"
    },
    {
      "trackId": "track456",
      "artist": "Artist Name",
      "title": "Another Song",
      "timestamp": "2024-01-14T12:05:00.000Z"
    }
  ]
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Error message",
  "details": "Additional error details"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "message": "Error details (only in development mode)"
}
```

---

## Usage Examples

### Using cURL

**Get lyrics:**
```bash
curl http://192.168.4.1:3000/api/lyrics/track123
```

**Store lyrics:**
```bash
curl -X POST http://192.168.4.1:3000/api/lyrics \
  -H "Content-Type: application/json" \
  -d '{
    "trackId": "track123",
    "artist": "The Beatles",
    "title": "Hey Jude",
    "lyrics": "Hey Jude, don'\''t make it bad\nTake a sad song and make it better"
  }'
```

**Search lyrics:**
```bash
curl http://192.168.4.1:3000/api/lyrics/search/beatles
```

**Get status:**
```bash
curl http://192.168.4.1:3000/api/status
```

### Using JavaScript (Fetch API)

**Get lyrics:**
```javascript
fetch('http://192.168.4.1:3000/api/lyrics/track123')
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));
```

**Store lyrics:**
```javascript
fetch('http://192.168.4.1:3000/api/lyrics', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    trackId: 'track123',
    artist: 'The Beatles',
    title: 'Hey Jude',
    lyrics: 'Hey Jude, don\'t make it bad\nTake a sad song and make it better'
  })
})
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));
```

### Using Swift (iOS)

```swift
struct Lyrics: Codable {
    let trackId: String
    let artist: String
    let title: String
    let lyrics: String
}

func sendLyrics(trackId: String, artist: String, title: String, lyrics: String) {
    let url = URL(string: "http://192.168.4.1:3000/api/lyrics")!
    var request = URLRequest(url: url)
    request.httpMethod = "POST"
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    
    let lyricsData = Lyrics(trackId: trackId, artist: artist, title: title, lyrics: lyrics)
    request.httpBody = try? JSONEncoder().encode(lyricsData)
    
    URLSession.shared.dataTask(with: request) { data, response, error in
        if let error = error {
            print("Error: \(error)")
            return
        }
        // Handle response
    }.resume()
}
```

---

## Rate Limiting

Currently, there is no rate limiting implemented. For production use, consider implementing rate limiting to prevent abuse.

---

## CORS

CORS is enabled for all origins. This allows the frontend to make requests from any domain.

---

## Caching

- **Default TTL**: 3600 seconds (1 hour)
- **Check Period**: 600 seconds (10 minutes)
- Configurable via `.env` file

---

## Notes

- All timestamps are in ISO 8601 format (UTC)
- Lyrics text can contain newline characters (`\n`)
- Track IDs should be unique and consistent
- The API is designed for local network use and is not intended for public internet exposure
