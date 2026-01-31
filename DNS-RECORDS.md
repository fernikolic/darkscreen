# DNS Records for clawdentials.com

Add these records in [Cloudflare Dashboard](https://dash.cloudflare.com):

## Required Records

### 1. A Record
- **Name:** `@` (or `clawdentials.com`)
- **Content:** `199.36.158.100`
- **Proxy status:** DNS only (grey cloud)

### 2. TXT Record (ownership verification)
- **Name:** `@` (or `clawdentials.com`)
- **Content:** `hosting-site=clawdentials`

### 3. TXT Record (SSL certificate)
- **Name:** `_acme-challenge`
- **Content:** `DSxrg8_Yeta4gBN92bo1T0TpUAu3A_KYbyOC7BJSMiE`

## Optional: www subdomain

If you want `www.clawdentials.com` to work:

### CNAME Record
- **Name:** `www`
- **Content:** `clawdentials.web.app`
- **Proxy status:** DNS only (grey cloud)

## Verification

After adding records, Firebase will automatically verify and issue SSL. Check status:
```bash
npx firebase-tools hosting:channel:open live
```

Or visit: https://console.firebase.google.com/project/clawdentials/hosting/sites
