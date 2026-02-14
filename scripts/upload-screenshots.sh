#!/usr/bin/env bash
# Upload labeled screenshot PNGs to Cloudflare R2.
# Usage:
#   bash scripts/upload-screenshots.sh --all          # upload every PNG
#   bash scripts/upload-screenshots.sh --slug aave    # upload only aave-*.png

set -euo pipefail

BUCKET="darkscreen-screenshots"
DIR="public/screenshots"

if [[ "${1:-}" == "--slug" && -n "${2:-}" ]]; then
  PATTERN="${2}-*.png"
elif [[ "${1:-}" == "--all" ]]; then
  PATTERN="*.png"
else
  echo "Usage: bash scripts/upload-screenshots.sh --all | --slug <slug>"
  exit 1
fi

# Only upload labeled PNGs (skip raw files)
COUNT=0
for file in $DIR/$PATTERN; do
  [ -f "$file" ] || continue

  basename=$(basename "$file")

  # Skip raw screenshots — they aren't served by the site
  if [[ "$basename" == *"-raw-"* ]]; then
    continue
  fi

  key="screenshots/$basename"
  echo "Uploading $key"
  npx wrangler r2 object put "$BUCKET/$key" --file "$file" --content-type "image/png"
  COUNT=$((COUNT + 1))
done

echo "Done — uploaded $COUNT files to R2 bucket '$BUCKET'"
