# Xcode Project Configuration Guide

After running the setup script, you need to configure a few settings in Xcode to ensure the native modules work correctly.

## Required Configuration Steps

### 1. Open the Workspace

⚠️ **Important**: Always open `TeslyricsApp.xcworkspace`, NOT `TeslyricsApp.xcodeproj`

```bash
cd ios-app/ios
open TeslyricsApp.xcworkspace
```

### 2. Configure Bridging Header

The bridging header allows Swift and Objective-C code to work together.

1. In Xcode, select the **TeslyricsApp** project in the Project Navigator
2. Select the **TeslyricsApp** target
3. Go to **Build Settings** tab
4. Search for "bridging" in the search bar
5. Find **Objective-C Bridging Header**
6. Double-click the value column and enter:
   ```
   TeslyricsApp/TeslyricsApp-Bridging-Header.h
   ```

### 3. Verify Swift Language Version

1. Still in **Build Settings**
2. Search for "swift language"
3. Verify **Swift Language Version** is set to **Swift 5**

### 4. Configure Signing & Capabilities

To run on a physical device:

1. Select the **TeslyricsApp** target
2. Go to **Signing & Capabilities** tab
3. Select your **Team** from the dropdown
4. Xcode will automatically create a signing certificate

For simulator testing, this step is optional.

### 5. Add Required Files to Target

Verify all Swift files are included in the target:

1. In Project Navigator, select `AppleMusicModule.swift`
2. In the File Inspector (right panel), ensure **Target Membership** includes **TeslyricsApp** (checkbox should be checked)
3. Repeat for `AppleMusicModule.m`

## Optional Configurations

### Enable Background Modes

Already configured in `Info.plist`, but you can verify:

1. Select **TeslyricsApp** target
2. Go to **Signing & Capabilities**
3. Click **+ Capability**
4. Add **Background Modes**
5. Enable:
   - ✅ Audio, AirPlay, and Picture in Picture
   - ✅ Background fetch

### Network Settings

Already configured in `Info.plist` to allow local network connections.

## Building the Project

### For Simulator

1. Select a simulator from the device dropdown (e.g., "iPhone 15 Pro")
2. Press **⌘R** or click the Play button

### For Physical Device

1. Connect your iPhone/iPad via USB
2. Trust the computer on your device if prompted
3. Select your device from the device dropdown
4. Press **⌘R** or click the Play button

## Troubleshooting Xcode Issues

### "Bridging header not found"

**Solution:**
- Double-check the bridging header path is exactly: `TeslyricsApp/TeslyricsApp-Bridging-Header.h`
- Make sure the file exists in the correct location
- Clean build folder: **Product → Clean Build Folder** (⌘⇧K)

### "CocoaPods not installed"

**Solution:**
```bash
cd ios
sudo gem install cocoapods
pod install
```

### "No such module 'React'"

**Solution:**
```bash
cd ios
pod install
```
Then clean and rebuild in Xcode.

### Build fails with "Command PhaseScriptExecution failed"

**Solution:**
```bash
cd ios
rm -rf Pods Podfile.lock
pod install
```
Then rebuild.

### "Code signing required"

**Solution:**
- Go to **Signing & Capabilities**
- Select your Team
- Or create a free Apple ID at appleid.apple.com

### Metro bundler won't start

**Solution:**
```bash
# In terminal
npm start -- --reset-cache
```

## Verification Checklist

Before building, verify:

- [ ] Opened `.xcworkspace` (not `.xcodeproj`)
- [ ] Bridging header path is set correctly
- [ ] All Swift files are included in target
- [ ] CocoaPods dependencies installed (`Pods/` folder exists)
- [ ] For device: Signing configured with valid team
- [ ] Metro bundler is running (`npm start`)

## Next Steps

Once Xcode is configured:

1. Build and run: **⌘R**
2. Grant permissions when prompted on device
3. Connect to Teslyrics WiFi
4. Follow the [QUICKSTART.md](QUICKSTART.md) guide

## Need Help?

- Check [DEVELOPMENT.md](DEVELOPMENT.md) for more details
- Review [React Native iOS Setup](https://reactnative.dev/docs/environment-setup)
- Open an issue on GitHub
