#!/usr/bin/env bash
# Download and decrypt Chromium profiles from R2
# Usage: DARKSCREEN_CRED_KEY=<key> bash scripts/download-profiles.sh [--slug <slug>]
#
# Downloads encrypted profile archives from the darkscreen-screenshots R2 bucket,
# decrypts them, and extracts to data/profiles/{slug}/.

set -euo pipefail

BUCKET="darkscreen-screenshots"
PROFILES_DIR="data/profiles"

# ─── Validate env ───────────────────────────────────────────────────
if [[ -z "${DARKSCREEN_CRED_KEY:-}" ]]; then
  echo "Error: DARKSCREEN_CRED_KEY environment variable is required."
  echo "Usage: DARKSCREEN_CRED_KEY=<key> bash scripts/download-profiles.sh [--slug <slug>]"
  exit 1
fi

mkdir -p "$PROFILES_DIR"

# ─── Parse args ─────────────────────────────────────────────────────
SLUG_FILTER=""
if [[ "${1:-}" == "--slug" && -n "${2:-}" ]]; then
  SLUG_FILTER="$2"
fi

# ─── Build list of slugs to download ───────────────────────────────
if [[ -n "$SLUG_FILTER" ]]; then
  SLUGS=("$SLUG_FILTER")
else
  # Read all login app slugs from auth-config.json
  SLUGS=()
  while IFS= read -r slug; do
    SLUGS+=("$slug")
  done < <(node -e "
    const config = require('./scripts/auth-config.json');
    for (const key of Object.keys(config)) console.log(key);
  ")
fi

if [[ ${#SLUGS[@]} -eq 0 ]]; then
  echo "No profiles to download."
  exit 0
fi

echo "Downloading ${#SLUGS[@]} profile(s) from R2..."

DOWNLOADED=0
SKIPPED=0
FAILED=0

for slug in "${SLUGS[@]}"; do
  R2_KEY="profiles/${slug}.tar.gz.enc"
  TMPFILE=$(mktemp /tmp/profile-${slug}-XXXXXX.tar.gz.enc)

  echo ""
  echo "[$slug] Downloading from R2..."

  # Download from R2 (non-fatal if not found)
  if ! npx wrangler r2 object get "$BUCKET/$R2_KEY" \
       --file "$TMPFILE" \
       --remote > /dev/null 2>&1; then
    echo "[$slug] Not found in R2, skipping."
    rm -f "$TMPFILE"
    SKIPPED=$((SKIPPED + 1))
    continue
  fi

  # Check file was actually downloaded (not empty)
  if [[ ! -s "$TMPFILE" ]]; then
    echo "[$slug] Downloaded file is empty, skipping."
    rm -f "$TMPFILE"
    SKIPPED=$((SKIPPED + 1))
    continue
  fi

  echo "[$slug] Downloaded ($(du -h "$TMPFILE" | cut -f1)), decrypting..."

  # Create profile directory
  PROFILE_DIR="$PROFILES_DIR/$slug"
  mkdir -p "$PROFILE_DIR"

  # Decrypt + extract
  if openssl enc -d -aes-256-cbc -salt -pbkdf2 \
       -pass env:DARKSCREEN_CRED_KEY \
       -in "$TMPFILE" | tar -xzf - -C "$PROFILE_DIR"; then
    echo "[$slug] Decrypted and extracted to $PROFILE_DIR"
    DOWNLOADED=$((DOWNLOADED + 1))
  else
    echo "[$slug] Error: Failed to decrypt/extract profile."
    FAILED=$((FAILED + 1))
  fi

  rm -f "$TMPFILE"
done

echo ""
echo "Done — downloaded $DOWNLOADED, skipped $SKIPPED, failed $FAILED."

if [[ $FAILED -gt 0 ]]; then
  exit 1
fi
