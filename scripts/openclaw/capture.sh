#!/bin/bash
# Darkscreen Screenshot Capture via OpenClaw Browser
#
# Usage:
#   ./scripts/openclaw/capture.sh              # All apps
#   ./scripts/openclaw/capture.sh uniswap      # Specific app

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
SCREENSHOT_DIR="$PROJECT_DIR/public/screenshots"
MANIFEST="$SCRIPT_DIR/capture-manifest.json"
PROFILE="openclaw"

cd "$PROJECT_DIR"
mkdir -p "$SCREENSHOT_DIR"

APP_FILTER="${1:-}"

echo "=== Darkscreen Capture ==="
echo "Output: $SCREENSHOT_DIR"
echo ""

# Ensure browser is running
echo "Checking OpenClaw browser..."
if ! openclaw browser status --browser-profile "$PROFILE" 2>/dev/null | grep -q "running: true"; then
  echo "Starting browser..."
  openclaw browser start --browser-profile "$PROFILE" --timeout 30000 2>/dev/null
  sleep 2
fi

# Resize viewport
openclaw browser resize 1440 900 --browser-profile "$PROFILE" 2>/dev/null

# Read manifest and build route list
ROUTES=$(cat "$MANIFEST" | node -e "
const data = JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));
const filter = '$APP_FILTER';
const apps = filter ? data.apps.filter(a => a.slug === filter) : data.apps;
for (const app of apps) {
  for (const route of app.routes) {
    console.log([app.slug, route.id, route.url, route.label].join('|'));
  }
}
")

TOTAL=0
SUCCESS=0
FAILED=0
SKIPPED_LIST=""

while IFS='|' read -r slug routeId url label; do
  [ -z "$slug" ] && continue
  TOTAL=$((TOTAL + 1))
  OUTFILE="$SCREENSHOT_DIR/${slug}-${routeId}.png"
  echo "[$TOTAL] $slug / $routeId"
  echo "     $url"

  # Navigate
  if ! openclaw browser navigate "$url" --browser-profile "$PROFILE" --timeout 20000 2>/dev/null; then
    echo "     SKIP (navigate failed)"
    FAILED=$((FAILED + 1))
    SKIPPED_LIST="$SKIPPED_LIST\n  - $slug/$routeId: navigate failed"
    continue
  fi

  # Wait for page to load and render
  sleep 5

  # Dismiss popups via JS evaluation
  openclaw browser evaluate --browser-profile "$PROFILE" --fn "(function() {
    var dismissed = [];
    var targets = ['Accept', 'Accept All', 'Accept all', 'Got it', 'I agree', 'Close', 'Dismiss', 'No thanks', 'OK', 'Continue', 'Agree'];
    var btns = document.querySelectorAll('button, [role=\"button\"], a[class*=\"close\"], [aria-label=\"Close\"]');
    btns.forEach(function(b) {
      var t = (b.textContent || '').trim();
      targets.forEach(function(target) {
        if (t === target || t.toLowerCase() === target.toLowerCase()) {
          try { b.click(); dismissed.push(t); } catch(e) {}
        }
      });
      if (b.getAttribute('aria-label') === 'Close') {
        try { b.click(); dismissed.push('aria-close'); } catch(e) {}
      }
    });
    var cookie = document.getElementById('onetrust-accept-btn-handler');
    if (cookie) { try { cookie.click(); dismissed.push('onetrust'); } catch(e) {} }
    return dismissed.join(',') || 'none';
  })()" 2>/dev/null || true

  sleep 1

  # Take screenshot (saves to ~/.openclaw/media/browser/)
  MEDIA_OUTPUT=$(openclaw browser screenshot --browser-profile "$PROFILE" --type png 2>&1)

  if echo "$MEDIA_OUTPUT" | grep -q "MEDIA:"; then
    # Extract the file path
    MEDIA_PATH=$(echo "$MEDIA_OUTPUT" | grep "MEDIA:" | sed 's/MEDIA://' | sed "s|~/|$HOME/|")

    if [ -f "$MEDIA_PATH" ]; then
      cp "$MEDIA_PATH" "$OUTFILE"
      SIZE=$(du -k "$OUTFILE" | cut -f1)
      echo "     OK (${SIZE}KB)"
      SUCCESS=$((SUCCESS + 1))
    else
      echo "     FAIL (media file not found: $MEDIA_PATH)"
      FAILED=$((FAILED + 1))
      SKIPPED_LIST="$SKIPPED_LIST\n  - $slug/$routeId: media file missing"
    fi
  else
    echo "     FAIL (screenshot error)"
    FAILED=$((FAILED + 1))
    SKIPPED_LIST="$SKIPPED_LIST\n  - $slug/$routeId: screenshot error"
  fi

done <<< "$ROUTES"

echo ""
echo "=== Capture Complete ==="
echo "Success: $SUCCESS / $TOTAL"
echo "Failed:  $FAILED"

if [ -n "$SKIPPED_LIST" ]; then
  echo ""
  echo "Skipped routes:"
  echo -e "$SKIPPED_LIST"
fi

echo ""
echo "Next: run 'node scripts/openclaw/wire-screenshots.mjs' to see inventory"
