# Teslyrics iOS App

> iOS companion app for Teslyrics - Send Apple Music lyrics to your Tesla

This React Native app integrates with Apple Music to retrieve currently playing songs and sends their lyrics to the Teslyrics Raspberry Pi server, which displays them in your Tesla's browser.

## Features

- 🎵 **Apple Music Integration**: Access currently playing track information
- 📡 **Real-time Sync**: Send lyrics to your Tesla automatically or manually
- 🔄 **Auto-Monitoring**: Automatically detect track changes and sync lyrics
- 📝 **Manual Lyrics**: Paste lyrics manually when not available from APIs
- 🌐 **Network Configuration**: Configure custom server URLs
- 💾 **Settings Persistence**: Remembers your preferences
- 📊 **Connection Status**: Visual indicator for server connectivity
- 🎨 **Clean UI**: Simple, intuitive interface optimized for iOS

## Requirements

- iOS 14.0 or later
- Xcode 14.0 or later (for building)
- Node.js 18+ and npm
- CocoaPods (for iOS dependencies)
- Access to Apple Music
- Teslyrics Raspberry Pi server running

## Installation

### 1. Install Dependencies

```bash
cd ios-app
npm install
```

### 2. Install iOS Dependencies

```bash
cd ios
pod install
cd ..
```

### 3. Configure the App

The app is pre-configured to connect to the default Teslyrics server at `http://192.168.4.1:3000`. You can change this in the app settings.

### 4. Build and Run

#### Using Xcode

1. Open `ios/TeslyricsApp.xcworkspace` in Xcode
2. Select your target device or simulator
3. Press ⌘R to build and run

#### Using React Native CLI

```bash
npm run ios
```

## Usage

### Initial Setup

1. **Connect to Teslyrics WiFi**
   - Network: `TeslyricsAP` (default)
   - Password: `teslyrics2024` (default)

2. **Launch the App**
   - The app will request permission to access Apple Music
   - Grant the permission when prompted

3. **Verify Connection**
   - Check the connection status indicator at the top
   - If disconnected, tap "Test Connection"
   - If needed, edit the server URL in settings

### Sending Lyrics

#### Manual Sync

1. Play a song in Apple Music
2. Paste the lyrics in the "Manual Lyrics" text field
3. Tap "Send Lyrics to Tesla"
4. Lyrics will be sent to the server and displayed in your Tesla browser

#### Auto-Monitoring

1. Enable "Auto-sync on track change" toggle
2. Tap "Start Auto-Monitoring"
3. The app will automatically detect track changes
4. When you manually add lyrics and tap send, they'll be synced automatically for future plays

### Viewing Lyrics in Tesla

1. Open Tesla browser
2. Navigate to: `http://192.168.4.1:3000`
3. Lyrics will appear when sent from the iOS app

## Architecture

### Native iOS Module

The app includes a native iOS module (`AppleMusicModule`) that bridges React Native with iOS MediaPlayer framework:

- `AppleMusicModule.swift`: Swift implementation
- `AppleMusicModule.m`: Objective-C bridge
- Provides access to currently playing track information
- Emits events when tracks change

### Services

- **TeslyricsClient**: Handles API communication with the Raspberry Pi server
- **AppleMusicService**: Interfaces with the native module
- **StorageService**: Persists app settings

### Screens

- **MainScreen**: Main app interface with all controls and status

## Configuration

### Server URL

Default: `http://192.168.4.1:3000`

To change:
1. Tap "Edit Server URL"
2. Enter new URL
3. Tap "Save"
4. Connection will be tested automatically

### Auto-Sync

Enable/disable automatic lyrics syncing when tracks change

### Background Modes

The app supports background audio monitoring (configured in Info.plist)

## Permissions

The app requests the following permissions:

- **Apple Music**: To access currently playing track information
- **Network**: To communicate with the Raspberry Pi server (local network only)

## API Integration

### Teslyrics Server API

#### Send Lyrics
```
POST /api/lyrics
{
  "trackId": "string",
  "artist": "string",
  "title": "string",
  "lyrics": "string"
}
```

#### Get Status
```
GET /api/status
```

#### Check Health
```
GET /api/status/health
```

## Lyrics Sources

**Important**: The MediaPlayer framework doesn't provide direct access to lyrics. You have several options:

1. **Manual Input**: Users paste lyrics from any source (Genius, Google, etc.)
2. **Future**: Third-Party API integration (Genius, Musixmatch, etc.)
3. **Future**: MusicKit integration (requires Apple Developer account)

## Troubleshooting

### App can't connect to server

- Ensure iPhone is connected to Teslyrics WiFi
- Verify server is running on Raspberry Pi
- Check server URL is correct
- Try "Test Connection" button

### No track detected

- Ensure a song is playing in Apple Music (not Spotify or other apps)
- Try stopping and restarting the song
- Check Apple Music permissions

### Lyrics not appearing in Tesla

- Verify server received lyrics (check cache count)
- Refresh Tesla browser
- Check Tesla is connected to Teslyrics WiFi
- Verify Tesla browser URL is correct

### Background monitoring not working

- Ensure app has background refresh enabled in iOS Settings
- Keep Apple Music playing in background
- iOS may pause background tasks to save battery

## Development

### Project Structure

```
ios-app/
├── src/
│   ├── components/        # Reusable UI components
│   ├── screens/          # Screen components
│   │   └── MainScreen.tsx
│   ├── services/         # Business logic
│   │   ├── TeslyricsClient.ts
│   │   ├── AppleMusicService.ts
│   │   └── StorageService.ts
│   ├── types/            # TypeScript definitions
│   │   └── index.ts
│   └── utils/            # Utility functions
├── ios/                  # Native iOS code
│   └── TeslyricsApp/
│       ├── AppleMusicModule.swift
│       ├── AppleMusicModule.m
│       └── Info.plist
├── App.tsx              # Main app entry
└── package.json
```

### Building for Production

1. Update version in `package.json` and `ios/TeslyricsApp/Info.plist`
2. Archive in Xcode: Product → Archive
3. Distribute to App Store or TestFlight

### Testing

```bash
npm test
```

### Linting

```bash
npm run lint
```

## Known Limitations

- **Lyrics API**: No direct API for lyrics from Apple Music - users must paste manually
- **Background Sync**: Limited by iOS background execution policies
- **Network**: Requires WiFi connection to Raspberry Pi
- **Platform**: iOS only (Android not supported)

## Future Enhancements

- [ ] Integration with Genius or Musixmatch API for automatic lyrics
- [ ] Playlist management
- [ ] Offline mode with cached lyrics
- [ ] Network discovery (Bonjour/mDNS)
- [ ] Multiple server support
- [ ] Lyrics editing interface
- [ ] Dark mode support

## Contributing

Contributions are welcome! Please ensure:

- Code follows React Native best practices
- TypeScript types are properly defined
- iOS-specific code is well documented
- Testing is performed on real iOS devices

## License

MIT License - See main project LICENSE file

## Support

For issues or questions:
- Check [Troubleshooting](#troubleshooting) section
- Review [IOS_INTEGRATION.md](../docs/IOS_INTEGRATION.md)
- Open an issue on GitHub

---

**Note**: This app requires a running Teslyrics Raspberry Pi server. See main project [README](../README.md) for server setup instructions.
