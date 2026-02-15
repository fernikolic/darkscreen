#!/bin/bash
# Retry the 24 apps that failed due to internet disconnection

SLUGS=(
  robosats
  blink-wallet
  cashu-me
  enuts
  minibits
  nutstash
  blitz-wallet
  samourai
  wasabi
  trezor-suite
  frame
  coinomi
  edge-wallet
  cake-wallet
  electrum
  bitcoin-core
  alchemy
  infura
  quicknode
  tenderly
  opennode
  speed
  fountain
  alby
)

TOTAL=${#SLUGS[@]}
SUCCESS=0
FAILED=0
FAIL_LIST=""

echo "═══════════════════════════════════════════════════════"
echo "  RETRY: $TOTAL apps (previously failed due to network)"
echo "═══════════════════════════════════════════════════════"
echo ""

for i in "${!SLUGS[@]}"; do
  SLUG="${SLUGS[$i]}"
  NUM=$((i + 1))
  echo "[$NUM/$TOTAL] Crawling $SLUG..."

  node scripts/crawl-app.mjs --slug "$SLUG" > "/tmp/crawl-retry-$SLUG.log" 2>&1

  # Check if screenshots were created
  FOUND=$(ls public/screenshots/${SLUG}-raw-*.png 2>/dev/null | wc -l)
  if [ "$FOUND" -gt 0 ]; then
    SUCCESS=$((SUCCESS + 1))
    echo "  ✓ $SLUG done ($FOUND screenshots)"
  else
    FAILED=$((FAILED + 1))
    FAIL_LIST="$FAIL_LIST $SLUG"
    # Show last error
    tail -3 "/tmp/crawl-retry-$SLUG.log" 2>/dev/null | sed 's/^/    /'
    echo "  ✗ $SLUG failed"
  fi
  echo ""
done

echo "═══════════════════════════════════════════════════════"
echo "  RETRY COMPLETE"
echo "  Success: $SUCCESS / $TOTAL"
echo "  Failed:  $FAILED"
if [ -n "$FAIL_LIST" ]; then
  echo "  Still failing:$FAIL_LIST"
fi
echo "═══════════════════════════════════════════════════════"
