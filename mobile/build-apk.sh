#!/bin/bash
set -e

echo "=========================================="
echo "  Building VBA Connect Release APK"
echo "=========================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "ERROR: package.json not found. Please run this script from the mobile/ directory."
    exit 1
fi

# Check if Android SDK is available
if [ -z "$ANDROID_HOME" ] && [ -z "$ANDROID_SDK_ROOT" ]; then
    echo "WARNING: ANDROID_HOME or ANDROID_SDK_ROOT not set."
    echo "Please set your Android SDK path."
    echo "Example: export ANDROID_HOME=$HOME/Library/Android/sdk"
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check for Java
if ! command -v java &> /dev/null; then
    echo "ERROR: Java not found. Please install JDK 17."
    exit 1
fi

echo ""
echo "Step 1: Installing dependencies..."
npm install

echo ""
echo "Step 2: Building release APK..."
cd android

# Clean previous build
echo "Cleaning previous build..."
./gradlew clean

# Build release APK
echo "Building release APK (this may take several minutes)..."
./gradlew assembleRelease

echo ""
echo "=========================================="
echo "  Build Complete!"
echo "=========================================="
APK_PATH="android/app/build/outputs/apk/release/app-release.apk"

if [ -f "$APK_PATH" ]; then
    echo "APK Location: $APK_PATH"
    echo ""
    echo "To install on a connected device:"
    echo "  adb install -r $APK_PATH"
else
    echo "ERROR: APK not found at expected location"
    exit 1
fi