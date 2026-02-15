#!/usr/bin/env bash
# Upload labeled screenshot PNGs to Cloudflare R2.
# Usage:
#   bash scripts/upload-screenshots.sh --all          # upload every PNG
#   bash scripts/upload-screenshots.sh --slug aave    # upload only aave-*.png
#
# Env: PARALLEL=25 to control concurrency (default 10)
#      SKIP_FILE=/path/to/list to skip already-uploaded filenames

set -euo pipefail

BUCKET="darkscreen-screenshots"
DIR="public/screenshots"
PARALLEL=${PARALLEL:-10}
SKIP_FILE=${SKIP_FILE:-""}

if [[ "${1:-}" == "--slug" && -n "${2:-}" ]]; then
  PATTERN="${2}-*.png"
elif [[ "${1:-}" == "--all" ]]; then
  PATTERN="*.png"
else
  echo "Usage: bash scripts/upload-screenshots.sh --all | --slug <slug>"
  exit 1
fi

# Build file list (skip raw screenshots + already uploaded)
TMPFILE=$(mktemp)
for file in $DIR/$PATTERN; do
  [ -f "$file" ] || continue
  basename=$(basename "$file")
  if [[ "$basename" == *"-raw-"* ]]; then
    continue
  fi
  # Skip if in skip file
  if [[ -n "$SKIP_FILE" && -f "$SKIP_FILE" ]] && grep -qxF "$basename" "$SKIP_FILE"; then
    continue
  fi
  echo "$file"
done > "$TMPFILE"

TOTAL=$(wc -l < "$TMPFILE" | tr -d ' ')
if [[ -n "$SKIP_FILE" && -f "$SKIP_FILE" ]]; then
  SKIPPED=$(wc -l < "$SKIP_FILE" | tr -d ' ')
  echo "Skipping $SKIPPED already-uploaded files"
fi
echo "Uploading $TOTAL files to R2 bucket '$BUCKET' ($PARALLEL parallel)..."

upload_one() {
  local file="$1"
  local basename
  basename=$(basename "$file")
  local key="screenshots/$basename"
  npx wrangler r2 object put "$BUCKET/$key" --file "$file" --content-type "image/png" --remote > /dev/null 2>&1
  echo "✓ $key"
}
export -f upload_one
export BUCKET

cat "$TMPFILE" | xargs -P "$PARALLEL" -I {} bash -c 'upload_one "$@"' _ {}

rm -f "$TMPFILE"
echo "Done — uploaded $TOTAL files to R2 bucket '$BUCKET'"
