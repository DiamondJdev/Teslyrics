# Teslyrics iOS App - Developer Guide

This guide provides detailed information for developers working on the Teslyrics iOS companion app.

## Prerequisites

### Required Software

- **macOS** 12.0 (Monterey) or later
- **Xcode** 14.0 or later
- **Node.js** 18.0 or later
- **npm** or **yarn**
- **CocoaPods** (installed via `sudo gem install cocoapods` or bundler)
- **iOS Simulator** or physical iOS device (iOS 14.0+)

### Optional Tools

- **React Native Debugger** - For debugging React Native apps
- **Flipper** - Mobile app debugging platform
- **Reactotron** - Development tool for React Native

## Project Setup

### Quick Start

```bash
# Navigate to ios-app directory
cd ios-app

# Run automated setup
./setup.sh

# Or manually:
npm install
cd ios && pod install && cd ..
```

### Xcode Configuration

After setup, you need to configure the Xcode project:

1. Open `ios/TeslyricsApp.xcworkspace` (NOT .xcodeproj)
2. Select the TeslyricsApp target
3. Go to Build Settings
4. Search for "Objective-C Bridging Header"
5. Set value to: `TeslyricsApp/TeslyricsApp-Bridging-Header.h`
6. Search for "Swift Compiler - Language"
7. Ensure Swift Language Version is set to Swift 5

### Running the App

```bash
# Start Metro bundler
npm start

# In another terminal, run on iOS
npm run ios

# Or run on specific simulator
npx react-native run-ios --simulator="iPhone 15 Pro"

# Or run on physical device
npx react-native run-ios --device
```

## Architecture

### Directory Structure

```
ios-app/
├── src/                       # Source code
│   ├── components/            # Reusable React components
│   ├── screens/              # Screen components
│   │   └── MainScreen.tsx    # Main app screen
│   ├── services/             # Business logic services
│   │   ├── TeslyricsClient.ts      # API client
│   │   ├── AppleMusicService.ts    # Apple Music integration
│   │   └── StorageService.ts       # Persistent storage
│   ├── types/                # TypeScript type definitions
│   │   └── index.ts
│   └── utils/                # Utility functions
├── ios/                      # Native iOS code
│   ├── Pods/                 # CocoaPods dependencies (gitignored)
│   ├── TeslyricsApp/
│   │   ├── AppDelegate.swift           # App entry point
│   │   ├── AppleMusicModule.swift      # Native Apple Music bridge
│   │   ├── AppleMusicModule.m          # Objective-C bridge
│   │   ├── TeslyricsApp-Bridging-Header.h
│   │   └── Info.plist                  # App configuration
│   └── TeslyricsApp.xcworkspace       # Xcode workspace
├── App.tsx                   # Root component
├── index.js                  # App entry point
└── package.json
```

### Key Components

#### Native Module: AppleMusicModule

Located in `ios/TeslyricsApp/AppleMusicModule.swift`

Provides React Native access to iOS MediaPlayer framework:

- **Methods**:
  - `requestAuthorization()` - Request Apple Music permission
  - `getCurrentTrack()` - Get currently playing track info
  - `getPlaybackState()` - Get playback state
  - `startMonitoring()` - Start listening for track changes
  - `stopMonitoring()` - Stop listening for track changes

- **Events**:
  - `onTrackChange` - Emitted when track changes
  - `onPlaybackStateChange` - Emitted when playback state changes

#### Service: AppleMusicService

Located in `src/services/AppleMusicService.ts`

TypeScript wrapper around the native module:

```typescript
const service = new AppleMusicService();

// Request authorization
await service.requestAuthorization();

// Get current track
const track = await service.getCurrentTrack();

// Monitor track changes
service.startMonitoring((track) => {
  console.log('Track changed:', track);
});
```

#### Service: TeslyricsClient

Located in `src/services/TeslyricsClient.ts`

Handles all API communication with the Raspberry Pi server:

```typescript
const client = new TeslyricsClient('http://192.168.4.1:3000');

// Send lyrics
await client.sendLyrics({
  trackId: '123',
  artist: 'Artist Name',
  title: 'Song Title',
  lyrics: 'Lyrics content...'
});

// Check server health
const isHealthy = await client.checkHealth();

// Get server status
const status = await client.getStatus();
```

#### Service: StorageService

Located in `src/services/StorageService.ts`

Manages persistent app configuration using AsyncStorage:

```typescript
const storage = new StorageService();

// Save configuration
await storage.saveConfig({
  serverUrl: 'http://192.168.4.1:3000',
  autoSync: true,
  backgroundSync: false
});

// Load configuration
const config = await storage.getConfig();
```

## Development Workflow

### Making Changes

1. **Code Changes**
   - Edit TypeScript/React files in `src/`
   - Changes auto-reload with Fast Refresh

2. **Native Code Changes**
   - Edit Swift files in `ios/TeslyricsApp/`
   - Rebuild app in Xcode or `npm run ios`

3. **Dependency Changes**
   - After adding npm packages: `npm install`
   - After adding native dependencies: `cd ios && pod install`

### Debugging

#### React Native Debugger

1. Install React Native Debugger
2. Open the app
3. Press `Cmd+D` in simulator
4. Select "Debug"

#### Console Logs

```typescript
console.log('Debug message');
console.error('Error message');
console.warn('Warning message');
```

#### Native Logs

In Xcode:
- View → Debug Area → Activate Console
- Or `Cmd+Shift+Y`

#### Network Requests

Use Flipper or React Native Debugger to inspect network calls

### Testing

#### Unit Tests

```bash
npm test
```

#### Manual Testing Checklist

- [ ] App launches without crashes
- [ ] Connection status shows correctly
- [ ] Server URL can be edited and saved
- [ ] Current track displays when music plays
- [ ] Manual lyrics can be input
- [ ] "Send Lyrics" sends to server
- [ ] Auto-monitoring detects track changes
- [ ] Settings persist after app restart
- [ ] Error messages display appropriately

## API Reference

### Teslyrics Server API

The app communicates with these endpoints:

#### POST /api/lyrics

Send lyrics to the server

```json
Request:
{
  "trackId": "string",
  "artist": "string", 
  "title": "string",
  "lyrics": "string"
}

Response:
{
  "success": boolean,
  "message": "string",
  "trackId": "string"
}
```

#### GET /api/status

Get server status

```json
Response:
{
  "status": "string",
  "uptime": number,
  "cache": {
    "keys": number,
    "hits": number,
    "misses": number
  }
}
```

#### GET /api/status/health

Health check endpoint - returns 200 OK if server is healthy

## Common Issues

### Pod Install Fails

```bash
cd ios
rm -rf Pods Podfile.lock
pod install --repo-update
```

### Metro Bundler Issues

```bash
# Clear cache
npm start -- --reset-cache

# Or
rm -rf node_modules
npm install
```

### Xcode Build Errors

1. Clean build folder: `Cmd+Shift+K`
2. Clean derived data: `Cmd+Option+Shift+K`
3. Restart Xcode

### Native Module Not Found

1. Ensure bridging header is configured
2. Rebuild the app: `npm run ios`
3. Check that Swift files are included in target

## Best Practices

### Code Style

- Follow TypeScript best practices
- Use meaningful variable names
- Add JSDoc comments for functions
- Keep components small and focused
- Use proper error handling

### Git Workflow

1. Create feature branch
2. Make small, focused commits
3. Test thoroughly
4. Submit pull request
5. Address review feedback

### Performance

- Avoid unnecessary re-renders
- Use React.memo for expensive components
- Debounce network requests
- Handle errors gracefully
- Clean up listeners in useEffect

## Adding New Features

### Adding a New Screen

1. Create screen component in `src/screens/`
2. Add navigation if needed
3. Update App.tsx routing

### Adding a New Service

1. Create service in `src/services/`
2. Export from service file
3. Import and use in components
4. Add TypeScript types in `src/types/`

### Adding Native Functionality

1. Create Swift file in `ios/TeslyricsApp/`
2. Create Objective-C bridge (.m file)
3. Update bridging header if needed
4. Create TypeScript wrapper in `src/services/`

## Resources

- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [iOS Developer Documentation](https://developer.apple.com/documentation/)
- [MediaPlayer Framework](https://developer.apple.com/documentation/mediaplayer)
- [CocoaPods Guide](https://guides.cocoapods.org/)

## Getting Help

- Check the main [README](README.md)
- Review [IOS_INTEGRATION.md](../docs/IOS_INTEGRATION.md)
- Search existing issues on GitHub
- Create a new issue with details

## License

MIT License - See main project LICENSE
