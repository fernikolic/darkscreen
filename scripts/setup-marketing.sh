#!/bin/bash

# Clawdentials Marketing Setup Script
# This script sets up Google Analytics and Search Console

set -e

PROJECT_ID="clawdentials"
SITE_URL="https://clawdentials.com"

echo "==================================="
echo "Clawdentials Marketing Setup"
echo "==================================="
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "Error: gcloud CLI not installed"
    echo "Install from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check current auth
echo "Step 1: Checking authentication..."
CURRENT_ACCOUNT=$(gcloud config get-value account 2>/dev/null)
echo "Currently logged in as: $CURRENT_ACCOUNT"
echo ""

# Enable required APIs
echo "Step 2: Enabling required APIs..."
gcloud services enable analyticsadmin.googleapis.com --project=$PROJECT_ID 2>/dev/null || true
gcloud services enable siteverification.googleapis.com --project=$PROJECT_ID 2>/dev/null || true
gcloud services enable searchconsole.googleapis.com --project=$PROJECT_ID 2>/dev/null || true
echo "APIs enabled."
echo ""

# For Google Analytics and Search Console, we need OAuth with specific scopes
echo "Step 3: Setting up OAuth for Analytics & Search Console..."
echo ""
echo "The CLI doesn't have the required scopes by default."
echo "Please run the following commands manually:"
echo ""
echo "=== GOOGLE ANALYTICS SETUP ==="
echo ""
echo "1. Go to Firebase Console:"
echo "   https://console.firebase.google.com/project/$PROJECT_ID/settings/integrations"
echo ""
echo "2. Click 'Google Analytics' and link/create a GA4 property"
echo ""
echo "3. Copy the Measurement ID (starts with G-)"
echo ""
echo "4. Update web/src/firebase.ts with:"
echo "   measurementId: 'G-YOUR_ID'"
echo ""
echo "5. Update web/index.html with the same ID"
echo ""

echo "=== GOOGLE SEARCH CONSOLE SETUP ==="
echo ""
echo "Option A - DNS TXT Record (recommended):"
echo "1. Go to: https://search.google.com/search-console"
echo "2. Add property: $SITE_URL"
echo "3. Choose 'Domain' verification"
echo "4. Add the TXT record to your DNS"
echo ""
echo "Option B - HTML Meta Tag:"
echo "1. Go to: https://search.google.com/search-console"
echo "2. Add property: $SITE_URL"
echo "3. Choose 'URL prefix' > 'HTML tag'"
echo "4. Copy the meta tag content"
echo "5. Update web/index.html google-site-verification"
echo ""

echo "=== AUTOMATED DNS VERIFICATION ==="
echo ""
echo "If clawdentials.com uses Cloudflare, you can automate DNS:"
echo ""
echo "1. Get your Cloudflare API token"
echo "2. Run:"
echo "   export CF_API_TOKEN=your_token"
echo "   export CF_ZONE_ID=your_zone_id"
echo "   curl -X POST \"https://api.cloudflare.com/client/v4/zones/\$CF_ZONE_ID/dns_records\" \\"
echo "     -H \"Authorization: Bearer \$CF_API_TOKEN\" \\"
echo "     -H \"Content-Type: application/json\" \\"
echo "     -d '{\"type\":\"TXT\",\"name\":\"@\",\"content\":\"google-site-verification=YOUR_CODE\"}'"
echo ""

echo "==================================="
echo "Quick Links:"
echo "==================================="
echo "Firebase Console: https://console.firebase.google.com/project/$PROJECT_ID"
echo "Google Analytics: https://analytics.google.com"
echo "Search Console:   https://search.google.com/search-console"
echo "Bing Webmaster:   https://www.bing.com/webmasters"
echo ""
echo "After setup, run: npm run build && npx firebase-tools deploy --only hosting"
