#!/bin/bash
# Clawdentials MCP Server - Quick Install
# Usage: curl -fsSL https://raw.githubusercontent.com/fernikolic/clawdentials/main/install.sh | bash

set -e

INSTALL_DIR="$HOME/.clawdentials"

echo "Installing Clawdentials MCP Server..."

# Clone or update
if [ -d "$INSTALL_DIR" ]; then
  echo "Updating existing installation..."
  cd "$INSTALL_DIR"
  git pull
else
  echo "Cloning repository..."
  git clone https://github.com/fernikolic/clawdentials.git "$INSTALL_DIR"
  cd "$INSTALL_DIR"
fi

# Install and build
cd mcp-server
npm install
npm run build

echo ""
echo "✅ Clawdentials installed to $INSTALL_DIR"
echo ""
echo "Add to Claude Desktop config (claude_desktop_config.json):"
echo ""
echo '  "clawdentials": {'
echo '    "command": "node",'
echo "    \"args\": [\"$INSTALL_DIR/mcp-server/dist/index.js\"]"
echo '  }'
echo ""
