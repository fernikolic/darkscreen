#!/usr/bin/env bash
# Download current screenshots from Cloudflare R2 so CI can archive/diff them.
#
# Usage:
#   bash scripts/download-r2-screenshots.sh              # download all
#   bash scripts/download-r2-screenshots.sh --slug aave  # download aave-*.png only
#
# Requires: wrangler CLI authenticated (via CLOUDFLARE_API_TOKEN env var)

set -euo pipefail

BUCKET="darkscreen-screenshots"
DIR="public/screenshots"
PARALLEL=${PARALLEL:-10}

mkdir -p "$DIR"

# Parse args
SLUG_FILTER=""
if [[ "${1:-}" == "--slug" && -n "${2:-}" ]]; then
  SLUG_FILTER="$2"
fi

echo "Listing objects in R2 bucket '$BUCKET'..."

# List all screenshot keys from R2 via Cloudflare API
# (wrangler v4 removed `r2 object list`, so we use the REST API directly)
KEYS_FILE=$(mktemp)
CURSOR=""
while true; do
  CURSOR_PARAM=""
  if [[ -n "$CURSOR" ]]; then
    CURSOR_PARAM="&cursor=$CURSOR"
  fi
  RESPONSE=$(curl -sf \
    "https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/r2/buckets/${BUCKET}/objects?prefix=screenshots/&per_page=1000${CURSOR_PARAM}" \
    -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}")

  echo "$RESPONSE" | node -e "
    const chunks = [];
    process.stdin.on('data', c => chunks.push(c));
    process.stdin.on('end', () => {
      const data = JSON.parse(chunks.join(''));
      const objects = data.result || [];
      for (const obj of objects) {
        const key = obj.key || '';
        if (!key) continue;
        const bn = key.replace('screenshots/', '');
        if (!bn.endsWith('.png') && !bn.endsWith('.webm')) continue;
        if (bn.includes('-raw-')) continue;
        console.log(key);
      }
    });
  " >> "$KEYS_FILE"

  # Check for pagination
  NEXT_CURSOR=$(echo "$RESPONSE" | node -e "
    const chunks = [];
    process.stdin.on('data', c => chunks.push(c));
    process.stdin.on('end', () => {
      const data = JSON.parse(chunks.join(''));
      const cursor = data.result_info?.cursor || '';
      if (cursor) process.stdout.write(cursor);
    });
  ")

  if [[ -z "$NEXT_CURSOR" ]]; then
    break
  fi
  CURSOR="$NEXT_CURSOR"
done

# Filter by slug if provided
if [[ -n "$SLUG_FILTER" ]]; then
  FILTERED=$(mktemp)
  grep "screenshots/${SLUG_FILTER}-" "$KEYS_FILE" > "$FILTERED" || true
  mv "$FILTERED" "$KEYS_FILE"
fi

TOTAL=$(wc -l < "$KEYS_FILE" | tr -d ' ')

if [[ "$TOTAL" -eq 0 ]]; then
  echo "No screenshots found in R2."
  rm -f "$KEYS_FILE"
  exit 0
fi

echo "Downloading $TOTAL files from R2 ($PARALLEL parallel)..."

download_one() {
  local key="$1"
  local basename
  basename=$(echo "$key" | sed 's|screenshots/||')
  local dest="$DIR/$basename"
  if [[ -f "$dest" ]]; then
    return 0
  fi
  npx wrangler r2 object get "$BUCKET/$key" --file "$dest" --remote > /dev/null 2>&1
  echo "  $basename"
}
export -f download_one
export BUCKET DIR

cat "$KEYS_FILE" | xargs -P "$PARALLEL" -I {} bash -c 'download_one "$@"' _ {}

rm -f "$KEYS_FILE"
echo "Done — downloaded $TOTAL files from R2."
