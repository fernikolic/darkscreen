#!/bin/bash
# Darkscreen Mobile Capture Setup
# Installs everything needed for native iOS/Android app screenshots

set -e

echo "═══════════════════════════════════════════════════"
echo "  Darkscreen Mobile Capture Setup"
echo "═══════════════════════════════════════════════════"
echo ""

# 1. Java (required by Maestro)
echo "Step 1: Java Runtime"
if java -version 2>/dev/null | grep -q "version"; then
  echo "  ✓ Java already installed"
else
  echo "  Installing Eclipse Temurin (Java)..."
  brew install --cask temurin
fi
echo ""

# 2. Maestro
echo "Step 2: Maestro CLI"
if [ -f "$HOME/.maestro/bin/maestro" ]; then
  echo "  ✓ Maestro already installed"
  "$HOME/.maestro/bin/maestro" --version
else
  echo "  Installing Maestro..."
  curl -Ls "https://get.maestro.mobile.dev" | bash
fi
echo ""

# 3. Xcode (iOS)
echo "Step 3: Xcode (for iOS Simulator)"
if xcodebuild -version 2>/dev/null | grep -q "Xcode"; then
  echo "  ✓ Xcode installed"
  xcodebuild -version
else
  echo "  ✗ Xcode not installed"
  echo "    Install from: https://apps.apple.com/app/xcode/id497799835"
  echo "    Or: xcode-select --install (command line tools only — no Simulator)"
  echo ""
  echo "    After installing Xcode, run:"
  echo "      sudo xcode-select -s /Applications/Xcode.app/Contents/Developer"
fi
echo ""

# 4. iOS Simulator setup
echo "Step 4: iOS Simulator"
if xcrun simctl list devices 2>/dev/null | grep -q "iPhone"; then
  echo "  ✓ iOS Simulators available"
  echo "  Available iPhones:"
  xcrun simctl list devices available | grep "iPhone" | head -5
  echo ""
  echo "  To boot a simulator:"
  echo '    xcrun simctl boot "iPhone 16 Pro"'
  echo "    open -a Simulator"
else
  echo "  ✗ No simulators found (Xcode required)"
fi
echo ""

# 5. Android (optional)
echo "Step 5: Android (optional)"
if command -v adb &>/dev/null; then
  echo "  ✓ Android SDK found"
  adb version
else
  echo "  ✗ Android SDK not found"
  echo "    Install Android Studio from: https://developer.android.com/studio"
  echo "    Then add to PATH: export PATH=\$PATH:\$HOME/Library/Android/sdk/platform-tools"
fi
echo ""

echo "═══════════════════════════════════════════════════"
echo "  Setup complete! Next steps:"
echo ""
echo "  # List registered apps"
echo "  node scripts/capture-mobile.mjs --list"
echo ""
echo "  # Capture native screenshots (iOS)"
echo "  node scripts/capture-mobile.mjs --slug coinbase --platform ios"
echo ""
echo "  # Capture web app with mobile viewport (no setup needed)"
echo "  node scripts/crawl-app.mjs --slug coinbase --mobile"
echo "═══════════════════════════════════════════════════"
