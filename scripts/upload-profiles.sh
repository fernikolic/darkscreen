#!/usr/bin/env bash
# Upload encrypted Chromium profiles to R2
# Usage: DARKSCREEN_CRED_KEY=<key> bash scripts/upload-profiles.sh [--slug <slug>]
#
# Encrypts and uploads the essential profile data (cookies, Local Storage, IndexedDB)
# to the darkscreen-screenshots R2 bucket under profiles/ prefix.

set -euo pipefail

BUCKET="darkscreen-screenshots"
PROFILES_DIR="data/profiles"

# ─── Validate env ───────────────────────────────────────────────────
if [[ -z "${DARKSCREEN_CRED_KEY:-}" ]]; then
  echo "Error: DARKSCREEN_CRED_KEY environment variable is required."
  echo "Usage: DARKSCREEN_CRED_KEY=<key> bash scripts/upload-profiles.sh [--slug <slug>]"
  exit 1
fi

# ─── Parse args ─────────────────────────────────────────────────────
SLUG_FILTER=""
if [[ "${1:-}" == "--slug" && -n "${2:-}" ]]; then
  SLUG_FILTER="$2"
fi

# ─── Build list of profile dirs to process ──────────────────────────
if [[ -n "$SLUG_FILTER" ]]; then
  if [[ ! -d "$PROFILES_DIR/$SLUG_FILTER" ]]; then
    echo "Error: Profile directory '$PROFILES_DIR/$SLUG_FILTER' not found."
    exit 1
  fi
  SLUGS=("$SLUG_FILTER")
else
  SLUGS=()
  for dir in "$PROFILES_DIR"/*/; do
    [ -d "$dir" ] || continue
    slug=$(basename "$dir")
    SLUGS+=("$slug")
  done
fi

if [[ ${#SLUGS[@]} -eq 0 ]]; then
  echo "No profile directories found in '$PROFILES_DIR/'."
  exit 0
fi

echo "Uploading ${#SLUGS[@]} profile(s) to R2..."

# ─── Essential subdirs to include in the archive ────────────────────
ESSENTIAL_DIRS=(
  "Default/Cookies"
  "Default/Local Storage"
  "Default/IndexedDB"
  "Default/Session Storage"
)

UPLOADED=0
FAILED=0

for slug in "${SLUGS[@]}"; do
  PROFILE_DIR="$PROFILES_DIR/$slug"
  echo ""
  echo "[$slug] Packaging profile..."

  # Build list of existing essential paths
  INCLUDE_ARGS=()
  for subdir in "${ESSENTIAL_DIRS[@]}"; do
    if [[ -e "$PROFILE_DIR/$subdir" ]]; then
      INCLUDE_ARGS+=("$subdir")
    fi
  done

  if [[ ${#INCLUDE_ARGS[@]} -eq 0 ]]; then
    echo "[$slug] Warning: No essential data found, skipping."
    continue
  fi

  # Create temp file for encrypted archive
  TMPFILE=$(mktemp /tmp/profile-${slug}-XXXXXX.tar.gz.enc)

  # Tar + gzip + encrypt in one pipeline
  if tar -czf - -C "$PROFILE_DIR" "${INCLUDE_ARGS[@]}" | \
     openssl enc -aes-256-cbc -salt -pbkdf2 -pass env:DARKSCREEN_CRED_KEY -out "$TMPFILE"; then
    echo "[$slug] Encrypted archive created ($(du -h "$TMPFILE" | cut -f1))"
  else
    echo "[$slug] Error: Failed to create encrypted archive."
    rm -f "$TMPFILE"
    FAILED=$((FAILED + 1))
    continue
  fi

  # Upload to R2
  R2_KEY="profiles/${slug}.tar.gz.enc"
  if npx wrangler r2 object put "$BUCKET/$R2_KEY" \
       --file "$TMPFILE" \
       --content-type "application/octet-stream" \
       --remote > /dev/null 2>&1; then
    echo "[$slug] Uploaded to R2: $R2_KEY"
    UPLOADED=$((UPLOADED + 1))
  else
    echo "[$slug] Error: Failed to upload to R2."
    FAILED=$((FAILED + 1))
  fi

  rm -f "$TMPFILE"
done

echo ""
echo "Done — uploaded $UPLOADED profile(s), $FAILED failed."

if [[ $FAILED -gt 0 ]]; then
  exit 1
fi
