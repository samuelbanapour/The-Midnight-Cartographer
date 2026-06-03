#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# integrate.sh — copy the native Monetization sources into the generated
# Android project. Run AFTER `npx cap add android`.
#
#   bash native/android/integrate.sh
#
# It only handles the file copies that are mechanical. You still must:
#   - drop the Amazon IAP jar into android/app/libs/
#   - apply build.gradle.additions.md and AndroidManifest.additions.xml
#   - create android/key.properties (see key.properties.example)
#   - create the supporter SKU in the Amazon Developer Console
# See AMAZON_MONETIZATION_SETUP.md for the full checklist.
# ---------------------------------------------------------------------------
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/../.." && pwd)"
PKG_DIR="$ROOT/android/app/src/main/java/com/midnightcartographer/game"

if [ ! -d "$ROOT/android" ]; then
  echo "✗ android/ not found. Run 'npx cap add android' first." >&2
  exit 1
fi

mkdir -p "$PKG_DIR"
cp "$HERE/MonetizationPlugin.java" "$PKG_DIR/MonetizationPlugin.java"
cp "$HERE/MainActivity.java"       "$PKG_DIR/MainActivity.java"

echo "✓ Copied MonetizationPlugin.java + MainActivity.java -> $PKG_DIR"
echo ""
echo "Remaining manual steps:"
echo "  1. Put the Amazon IAP jar in android/app/libs/"
echo "  2. Apply native/android/build.gradle.additions.md to android/app/build.gradle"
echo "  3. Merge native/android/AndroidManifest.additions.xml into the app manifest"
echo "  4. cp native/android/key.properties.example android/key.properties  (then edit)"
echo "  5. Create the supporter SKU in the Amazon Developer Console"
echo ""
echo "Then: npm run build && npm run cap:sync && (cd android && ./gradlew bundleRelease)"
