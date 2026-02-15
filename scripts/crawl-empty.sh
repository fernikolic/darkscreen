#!/bin/bash
# Crawl all apps with empty screens (public authType only)
# Login and wallet apps need manual intervention

PUBLIC_SLUGS=(
  metamask rainbow rabby zerion coinbase-wallet ledger-live exodus okx-wallet xverse
  etherscan breez wallet-of-satoshi phoenix muun bluewallet green aqua zeus sparrow
  nunchuk bitkey backpack solflare keplr tonkeeper argent taho bisq robosats hodlhodl
  peach-bitcoin boltz blockstream-explorer blockchair amboss dune arkham coingecko
  coinmarketcap defillama l2beat token-terminal solscan btcpay-server moonpay transak
  umbrel start9 lnbits blink-wallet cashu-me enuts minibits nutstash blitz-wallet
  samourai wasabi trezor-suite frame coinomi edge-wallet cake-wallet electrum
  bitcoin-core alchemy infura quicknode tenderly opennode speed fountain alby
)

TOTAL=${#PUBLIC_SLUGS[@]}
SUCCESS=0
FAILED=0
FAIL_LIST=""

echo "═══════════════════════════════════════════════════════"
echo "  BATCH CRAWL: $TOTAL public apps"
echo "═══════════════════════════════════════════════════════"
echo ""

for i in "${!PUBLIC_SLUGS[@]}"; do
  SLUG="${PUBLIC_SLUGS[$i]}"
  NUM=$((i + 1))
  echo "[$NUM/$TOTAL] Crawling $SLUG..."

  if node scripts/crawl-app.mjs --slug "$SLUG" 2>&1 | tee "/tmp/crawl-$SLUG.log" | grep -E "(Screenshots saved|CRAWL COMPLETE|Error|failed|FATAL)"; then
    if grep -q "CRAWL COMPLETE\|Screenshots saved" "/tmp/crawl-$SLUG.log" 2>/dev/null; then
      SUCCESS=$((SUCCESS + 1))
      echo "  ✓ $SLUG done"
    else
      FAILED=$((FAILED + 1))
      FAIL_LIST="$FAIL_LIST $SLUG"
      echo "  ✗ $SLUG failed"
    fi
  else
    # Check if screenshots were created
    if ls public/screenshots/${SLUG}-raw-*.png 1>/dev/null 2>&1; then
      SUCCESS=$((SUCCESS + 1))
      echo "  ✓ $SLUG done (screenshots found)"
    else
      FAILED=$((FAILED + 1))
      FAIL_LIST="$FAIL_LIST $SLUG"
      echo "  ✗ $SLUG failed (no screenshots)"
    fi
  fi

  echo ""
done

echo "═══════════════════════════════════════════════════════"
echo "  BATCH COMPLETE"
echo "  Success: $SUCCESS / $TOTAL"
echo "  Failed:  $FAILED"
if [ -n "$FAIL_LIST" ]; then
  echo "  Failed apps:$FAIL_LIST"
fi
echo "═══════════════════════════════════════════════════════"
