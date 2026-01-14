// Configuration
const API_BASE_URL = window.location.origin;
const POLL_INTERVAL = 5000; // 5 seconds
const STATUS_UPDATE_INTERVAL = 10000; // 10 seconds

// State
let currentTrackId = null;
let pollTimer = null;
let statusTimer = null;

// DOM Elements
const songTitle = document.getElementById('songTitle');
const songArtist = document.getElementById('songArtist');
const lyricsContainer = document.getElementById('lyricsContainer');
const statusIndicator = document.getElementById('statusIndicator');
const statusText = document.getElementById('statusText');
const cacheCount = document.getElementById('cacheCount');
const serverInfo = document.getElementById('serverInfo');
const refreshBtn = document.getElementById('refreshBtn');
const clearBtn = document.getElementById('clearBtn');

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    console.log('Teslyrics initialized');
    
    // Check for track ID in URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const trackId = urlParams.get('trackId');
    
    if (trackId) {
        loadLyrics(trackId);
    }
    
    // Set up event listeners
    refreshBtn.addEventListener('click', () => {
        if (currentTrackId) {
            loadLyrics(currentTrackId);
        } else {
            location.reload();
        }
    });
    
    clearBtn.addEventListener('click', clearDisplay);
    
    // Start status updates
    updateStatus();
    statusTimer = setInterval(updateStatus, STATUS_UPDATE_INTERVAL);
    
    // Listen for messages from iOS app (if using WebSocket in future)
    window.addEventListener('message', handleMessage);
});

// Load lyrics from API
async function loadLyrics(trackId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/lyrics/${trackId}`);
        
        if (!response.ok) {
            if (response.status === 404) {
                showPlaceholder('Lyrics not found', 'Send lyrics from iOS app to cache them');
                return;
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        displayLyrics(data.lyrics);
        currentTrackId = trackId;
        
    } catch (error) {
        console.error('Error loading lyrics:', error);
        showPlaceholder('Error loading lyrics', error.message);
        setConnectionStatus(false);
    }
}

// Display lyrics on screen
function displayLyrics(lyricsData) {
    const { artist, title, lyrics } = lyricsData;
    
    // Update song info
    songTitle.textContent = title || 'Unknown Title';
    songArtist.textContent = artist || 'Unknown Artist';
    
    // Display lyrics
    lyricsContainer.innerHTML = '';
    const lyricsContent = document.createElement('div');
    lyricsContent.className = 'lyrics-content';
    
    if (typeof lyrics === 'string') {
        // If lyrics is a plain string, split by lines
        const lines = lyrics.split('\n');
        lines.forEach((line, index) => {
            const lineDiv = document.createElement('div');
            lineDiv.className = 'lyrics-line';
            lineDiv.textContent = line || '♪';
            lineDiv.style.animationDelay = `${index * 0.05}s`;
            lyricsContent.appendChild(lineDiv);
        });
    } else if (Array.isArray(lyrics)) {
        // If lyrics is an array of line objects with timestamps
        lyrics.forEach((line, index) => {
            const lineDiv = document.createElement('div');
            lineDiv.className = 'lyrics-line';
            lineDiv.textContent = line.text || line || '♪';
            lineDiv.dataset.timestamp = line.timestamp || 0;
            lineDiv.style.animationDelay = `${index * 0.05}s`;
            lyricsContent.appendChild(lineDiv);
        });
    }
    
    lyricsContainer.appendChild(lyricsContent);
    setConnectionStatus(true);
}

// Show placeholder message
function showPlaceholder(title, message) {
    lyricsContainer.innerHTML = `
        <div class="lyrics-placeholder">
            <p>🎤</p>
            <p>${title}</p>
            <p class="help-text">${message}</p>
        </div>
    `;
}

// Clear display
function clearDisplay() {
    currentTrackId = null;
    songTitle.textContent = 'No song playing';
    songArtist.textContent = 'Connect from your iOS app';
    showPlaceholder('Lyrics will appear here', 'Use the Teslyrics iOS app to send lyrics from Apple Music');
}

// Update server status
async function updateStatus() {
    try {
        const [statusResponse, cacheResponse] = await Promise.all([
            fetch(`${API_BASE_URL}/api/status`),
            fetch(`${API_BASE_URL}/api/status/cache`)
        ]);
        
        if (statusResponse.ok && cacheResponse.ok) {
            const statusData = await statusResponse.json();
            const cacheData = await cacheResponse.json();
            
            // Update cache count
            cacheCount.textContent = `${cacheData.count} song${cacheData.count !== 1 ? 's' : ''} cached`;
            
            // Update server info
            const uptime = formatUptime(statusData.uptime);
            serverInfo.textContent = `Server uptime: ${uptime}`;
            
            setConnectionStatus(true);
        } else {
            throw new Error('Status check failed');
        }
    } catch (error) {
        console.error('Error updating status:', error);
        setConnectionStatus(false);
    }
}

// Set connection status indicator
function setConnectionStatus(connected) {
    const dot = statusIndicator.querySelector('.status-dot');
    if (connected) {
        statusText.textContent = 'Connected';
        dot.classList.remove('disconnected');
    } else {
        statusText.textContent = 'Disconnected';
        dot.classList.add('disconnected');
    }
}

// Format uptime in human-readable format
function formatUptime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
        return `${minutes}m ${secs}s`;
    } else {
        return `${secs}s`;
    }
}

// Handle messages from iOS app (for future WebSocket implementation)
function handleMessage(event) {
    try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'lyrics') {
            displayLyrics(data.lyrics);
            currentTrackId = data.trackId;
        } else if (data.type === 'trackChange') {
            loadLyrics(data.trackId);
        }
    } catch (error) {
        console.error('Error handling message:', error);
    }
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (pollTimer) clearInterval(pollTimer);
    if (statusTimer) clearInterval(statusTimer);
});

// Expose API for iOS app integration
window.TeslyricsAPI = {
    loadLyrics,
    clearDisplay,
    getCurrentTrackId: () => currentTrackId
};

console.log('Teslyrics app ready! 🚗🎵');
