#!/bin/bash

# Setup script for Teslyrics iOS App
# This script installs all necessary dependencies

set -e

echo "==================================="
echo "Teslyrics iOS App Setup"
echo "==================================="
echo ""

# Check if we're in the ios-app directory
if [ ! -f "package.json" ]; then
  echo "Error: Please run this script from the ios-app directory"
  exit 1
fi

# Check Node.js installation
echo "Checking Node.js installation..."
if ! command -v node &> /dev/null; then
  echo "Error: Node.js is not installed. Please install Node.js 18+ first."
  exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo "Error: Node.js version 18 or higher is required. Current version: $(node -v)"
  exit 1
fi
echo "✓ Node.js $(node -v) found"
echo ""

# Install npm dependencies
echo "Installing npm dependencies..."
npm install
echo "✓ npm dependencies installed"
echo ""

# Check if running on macOS
if [[ "$OSTYPE" == "darwin"* ]]; then
  echo "Detected macOS - setting up iOS dependencies..."
  
  # Check if CocoaPods is installed
  if ! command -v pod &> /dev/null; then
    echo "CocoaPods not found. Installing..."
    
    # Check if bundler is available
    if command -v bundle &> /dev/null; then
      bundle install
    else
      sudo gem install cocoapods
    fi
  fi
  
  echo "✓ CocoaPods is installed"
  echo ""
  
  # Install iOS dependencies
  echo "Installing iOS dependencies (CocoaPods)..."
  cd ios
  pod install
  cd ..
  echo "✓ iOS dependencies installed"
  echo ""
  
  echo "==================================="
  echo "Setup Complete!"
  echo "==================================="
  echo ""
  echo "Next steps:"
  echo "1. Open ios/TeslyricsApp.xcworkspace in Xcode"
  echo "2. Configure the bridging header if needed:"
  echo "   - Build Settings → Swift Compiler - General"
  echo "   - Set 'Objective-C Bridging Header' to:"
  echo "     TeslyricsApp/TeslyricsApp-Bridging-Header.h"
  echo "3. Select your target device"
  echo "4. Press Cmd+R to build and run"
  echo ""
  echo "Or run: npm run ios"
  echo ""
else
  echo "Warning: Not running on macOS. iOS development requires macOS and Xcode."
  echo "npm dependencies have been installed, but you'll need macOS to build the iOS app."
  echo ""
fi
