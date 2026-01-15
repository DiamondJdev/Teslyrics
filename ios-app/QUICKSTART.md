# Quick Start Guide - Teslyrics iOS App

This guide will help you get the Teslyrics iOS app up and running quickly.

## Prerequisites Checklist

- [ ] macOS computer (required for iOS development)
- [ ] Xcode 14.0+ installed
- [ ] Node.js 18+ installed
- [ ] iPhone or iPad with iOS 14.0+ (or iOS Simulator)
- [ ] Teslyrics Raspberry Pi server set up and running

## 5-Minute Setup

### Step 1: Install Dependencies (2 minutes)

```bash
cd ios-app
./setup.sh
```

This will:
- Install npm packages
- Install CocoaPods dependencies
- Set up the iOS project

### Step 2: Configure Xcode (1 minute)

1. Open `ios/TeslyricsApp.xcworkspace` in Xcode
2. Go to Build Settings → Search "bridging"
3. Set "Objective-C Bridging Header" to: `TeslyricsApp/TeslyricsApp-Bridging-Header.h`
4. Select your target device from the dropdown

### Step 3: Build and Run (2 minutes)

In Xcode, press `⌘R` or click the Play button.

Or from terminal:
```bash
npm run ios
```

## First Time Use

### 1. Grant Permissions

When the app launches, it will request Apple Music access:
- Tap "OK" to allow

### 2. Connect to Teslyrics WiFi

On your iPhone:
1. Settings → WiFi
2. Connect to "TeslyricsAP"
3. Enter password: "teslyrics2024"

### 3. Verify Connection

1. Open the Teslyrics app
2. Check the connection status at the top
3. If disconnected, tap "Test Connection"

### 4. Send Your First Lyrics

1. Open Apple Music and play a song
2. Find the lyrics online (e.g., Google, Genius)
3. Copy the lyrics
4. Paste in the "Manual Lyrics" field in Teslyrics app
5. Tap "Send Lyrics to Tesla"
6. In your Tesla browser, navigate to `http://192.168.4.1:3000`
7. Lyrics appear!

## Auto-Monitoring Feature

For automatic syncing:

1. Enable "Auto-sync on track change" toggle
2. Tap "Start Auto-Monitoring"
3. The app will detect when tracks change
4. Previously sent lyrics will appear automatically

## Common First-Time Issues

### "Cannot Connect to Server"

**Solution:** 
- Ensure your iPhone is connected to TeslyricsAP WiFi
- Verify Raspberry Pi server is running
- Check server URL is `http://192.168.4.1:3000`

### "No Track Playing"

**Solution:**
- Open Apple Music (not Spotify or YouTube Music)
- Play a song
- Wait a few seconds for detection

### "Build Failed in Xcode"

**Solution:**
```bash
cd ios
rm -rf Pods Podfile.lock
pod install
```
Then rebuild in Xcode

### "Bridging Header Not Found"

**Solution:**
1. In Xcode, go to Build Settings
2. Search for "Objective-C Bridging Header"
3. Set to: `TeslyricsApp/TeslyricsApp-Bridging-Header.h`

## Tips for Best Experience

1. **Keep Lyrics Short**: Tesla browser works best with concise lyrics
2. **Enable Auto-Sync**: Set it once, enjoy automatic updates
3. **Check Cache Count**: Shows how many songs are cached
4. **Stay Connected**: Keep WiFi connection to TeslyricsAP

## Next Steps

- Read the full [README](README.md) for detailed features
- Check [DEVELOPMENT.md](DEVELOPMENT.md) for development info
- Review [IOS_INTEGRATION.md](../docs/IOS_INTEGRATION.md) for technical details

## Need Help?

1. Check [Troubleshooting](README.md#troubleshooting) section
2. Review [Common Issues](DEVELOPMENT.md#common-issues)
3. Open an issue on GitHub

---

**Enjoy displaying lyrics in your Tesla! 🚗🎵**
