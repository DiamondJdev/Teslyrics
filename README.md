# Teslyrics 🚗🎵

> Display Apple Music lyrics in your Tesla browser using a Raspberry Pi

Teslyrics is a local hosting solution that brings synchronized lyrics from Apple Music to your Tesla's web browser. Using a Raspberry Pi as an in-car server, it creates a WiFi hotspot that allows your iPhone and Tesla to communicate, displaying lyrics in real-time as you drive.

## ✨ Features

- 🎵 **Real-time Lyrics Display**: Show Apple Music lyrics on your Tesla's browser
- 📡 **Local WiFi Hotspot**: Raspberry Pi creates its own network for in-car connectivity
- 💾 **Offline Caching**: Lyrics are cached locally for instant access
- 📱 **iOS Integration**: Companion app sends lyrics from Apple Music
- 🚀 **Auto-Start**: Systemd service starts automatically on boot
- 🎨 **Tesla-Optimized UI**: Dark theme designed for in-car viewing
- 🔄 **Real-time Sync**: Updates automatically when songs change

## 🏗️ Architecture

```
┌─────────────┐         ┌──────────────────┐         ┌─────────────┐
│   iPhone    │  WiFi   │  Raspberry Pi    │  WiFi   │    Tesla    │
│             │◄───────►│                  │◄───────►│   Browser   │
│ Apple Music │ Lyrics  │  Teslyrics       │   Web   │   Display   │
│     App     │  Data   │   Server         │  Page   │             │
└─────────────┘         └──────────────────┘         └─────────────┘
```

## 🚀 Quick Start

### Hardware Requirements

- Raspberry Pi 3B+ or later (4 recommended)
- MicroSD card (16GB+, Class 10)
- USB power supply or Tesla USB port
- Optional: Case and cooling

### Installation

1. **Flash Raspberry Pi OS** to your microSD card

2. **Clone and install** on the Raspberry Pi:
   ```bash
   git clone https://github.com/DiamondJdev/Teslyrics.git ~/teslyrics
   cd ~/teslyrics
   chmod +x scripts/install-pi.sh
   ./scripts/install-pi.sh
   ```

3. **Configure environment**:
   ```bash
   nano .env
   ```

4. **Set up auto-start service**:
   ```bash
   npm run setup-service
   ```

5. **Set up WiFi hotspot** (optional but recommended):
   ```bash
   npm run setup-hotspot
   sudo reboot
   ```

6. **Start the service**:
   ```bash
   sudo systemctl start teslyrics
   ```

## 📖 Documentation

- **[Setup Guide](docs/SETUP.md)** - Complete installation and configuration instructions
- **[API Documentation](docs/API.md)** - REST API endpoints and usage
- **[iOS Integration](docs/IOS_INTEGRATION.md)** - Guide for building the companion iOS app
- **[TODO List](docs/TODO.md)** - Planned features and improvements

## 🎯 Usage

### In Your Tesla

1. Connect to the Teslyrics WiFi network:
   - SSID: `TeslyricsAP`
   - Password: `teslyrics2024`

2. Open the Tesla browser and navigate to:
   ```
   http://192.168.4.1:3000
   ```

3. Lyrics will appear automatically when sent from your iPhone!

### With Your iPhone

1. Connect to the same Teslyrics WiFi network
2. Use the companion app to send lyrics from Apple Music
3. Lyrics are cached on the Pi for instant display in your Tesla

## 🛠️ API Endpoints

- `GET /api/lyrics/:trackId` - Get cached lyrics
- `POST /api/lyrics` - Store new lyrics
- `GET /api/status` - Server status and info
- `GET /api/status/cache` - Cache statistics

See [API Documentation](docs/API.md) for complete details.

## 📁 Project Structure

```
teslyrics/
├── backend/              # Node.js/Express server
│   ├── server.js        # Main server file
│   ├── cache.js         # Caching logic
│   └── routes/          # API routes
├── frontend/            # Web interface for Tesla
│   ├── index.html       # Main page
│   ├── styles.css       # Styling
│   └── app.js           # Client-side logic
├── scripts/             # Setup and deployment scripts
│   ├── install-pi.sh    # Installation script
│   ├── setup-service.sh # Systemd service setup
│   └── setup-hotspot.sh # WiFi hotspot setup
├── config/              # Configuration files
│   └── hotspot.conf     # Hotspot configuration
└── docs/                # Documentation
    ├── SETUP.md         # Setup guide
    ├── API.md           # API documentation
    ├── IOS_INTEGRATION.md # iOS app guide
    └── TODO.md          # Future enhancements
```

## 🔧 Configuration

### Environment Variables

Edit `.env` to configure:

```bash
PORT=3000                # Server port
HOST=0.0.0.0            # Bind address
PI_IP=192.168.4.1       # Raspberry Pi IP
CACHE_TTL=3600          # Cache time-to-live (seconds)
```

### WiFi Hotspot

Edit `config/hotspot.conf` to customize:

```bash
TESLYRICS_SSID=TeslyricsAP      # Network name
TESLYRICS_PASSWORD=teslyrics2024 # WiFi password
TESLYRICS_CHANNEL=7              # WiFi channel
```

## 🎨 Screenshots

> The web interface features a dark theme optimized for Tesla's browser, with large, readable text and smooth animations.

## 🐛 Troubleshooting

### Server won't start
```bash
sudo journalctl -u teslyrics -f  # Check logs
sudo systemctl status teslyrics   # Check status
```

### Can't connect to WiFi
```bash
sudo systemctl status hostapd     # Check hotspot
sudo systemctl status dnsmasq     # Check DHCP
```

### More help
See the [Setup Guide](docs/SETUP.md) for detailed troubleshooting.

## 🗺️ Roadmap

- [x] Basic server implementation
- [x] WiFi hotspot configuration
- [x] Auto-start service
- [x] Lyrics caching
- [ ] iOS companion app
- [ ] Real-time sync with timestamps
- [ ] WebSocket support
- [ ] Persistent storage (SQLite)
- [ ] Multiple user support

See [TODO.md](docs/TODO.md) for the complete list.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## 📄 License

MIT License - See LICENSE file for details

## 🙏 Acknowledgments

- Built for Tesla enthusiasts who love music
- Designed for use with Apple Music
- Optimized for Raspberry Pi

---

**Note**: This project requires a companion iOS app to send lyrics from Apple Music. See the [iOS Integration Guide](docs/IOS_INTEGRATION.md) for development instructions.
