#!/bin/bash
# Run the Darkscreen screenshot capture via OpenClaw
#
# Usage:
#   ./scripts/openclaw/run-capture.sh          # Capture all apps
#   ./scripts/openclaw/run-capture.sh uniswap  # Capture specific app

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

cd "$PROJECT_DIR"

if ! command -v openclaw &> /dev/null; then
    echo "OpenClaw not installed. Run: npm install -g openclaw@latest"
    exit 1
fi

APP_FILTER="${1:-all}"

if [ "$APP_FILTER" = "all" ]; then
    PROMPT="Read the capture manifest at scripts/openclaw/capture-manifest.json and the skill instructions at scripts/openclaw/SKILL.md. Then systematically capture screenshots for ALL apps in the manifest. Save each screenshot to public/screenshots/ using the naming convention {slug}-{routeId}.png. Work through every app and every route."
else
    PROMPT="Read the capture manifest at scripts/openclaw/capture-manifest.json and the skill instructions at scripts/openclaw/SKILL.md. Then capture screenshots ONLY for the app with slug '$APP_FILTER'. Save each screenshot to public/screenshots/ using the naming convention {slug}-{routeId}.png."
fi

echo "Starting Darkscreen capture via OpenClaw..."
echo "App filter: $APP_FILTER"
echo "Output dir: public/screenshots/"
echo ""

openclaw --prompt "$PROMPT" --skill-file scripts/openclaw/SKILL.md
