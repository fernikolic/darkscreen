#!/bin/bash
# Crawl remaining login + wallet apps (public landing pages only, no auth)

LOGIN_SLUGS=(
  okx bybit crypto-com gemini robinhood-crypto river strike swan-bitcoin fold
  unchained bitstamp gate-io bitget mexc htx bitfinex bitmex upbit nansen
  glassnode voltage bitvavo bullish bitso luno woo-x phemex bingx coinex
)

WALLET_SLUGS=(
  safe 1inch dydx hyperliquid layerswap wormhole stargate opensea blur
  magic-eden debank raydium orca marinade sky compound pendle gmx pancakeswap
  sushiswap yearn eigenlayer rocket-pool jito aerodrome morpho spark snapshot
  ens across hop lifi orbiter synapse trader-joe velodrome camelot osmosis
  thorswap maple-finance aura-finance convex balancer
)

ALL_SLUGS=("${LOGIN_SLUGS[@]}" "${WALLET_SLUGS[@]}")
TOTAL=${#ALL_SLUGS[@]}
SUCCESS=0
FAILED=0
FAIL_LIST=""

echo "═══════════════════════════════════════════════════════"
echo "  CRAWL: $TOTAL login + wallet apps (public pages)"
echo "  Login: ${#LOGIN_SLUGS[@]}  |  Wallet: ${#WALLET_SLUGS[@]}"
echo "═══════════════════════════════════════════════════════"
echo ""

for i in "${!ALL_SLUGS[@]}"; do
  SLUG="${ALL_SLUGS[$i]}"
  NUM=$((i + 1))
  echo "[$NUM/$TOTAL] Crawling $SLUG..."

  node scripts/crawl-app.mjs --slug "$SLUG" > "/tmp/crawl-remaining-$SLUG.log" 2>&1

  FOUND=$(ls public/screenshots/${SLUG}-raw-*.png 2>/dev/null | wc -l)
  if [ "$FOUND" -gt 0 ]; then
    SUCCESS=$((SUCCESS + 1))
    echo "  ✓ $SLUG ($FOUND screenshots)"
  else
    FAILED=$((FAILED + 1))
    FAIL_LIST="$FAIL_LIST $SLUG"
    tail -2 "/tmp/crawl-remaining-$SLUG.log" 2>/dev/null | sed 's/^/    /'
    echo "  ✗ $SLUG failed"
  fi
  echo ""
done

echo "═══════════════════════════════════════════════════════"
echo "  COMPLETE"
echo "  Success: $SUCCESS / $TOTAL"
echo "  Failed:  $FAILED"
if [ -n "$FAIL_LIST" ]; then
  echo "  Failed:$FAIL_LIST"
fi
echo "═══════════════════════════════════════════════════════"
