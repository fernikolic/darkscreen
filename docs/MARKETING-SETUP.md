# Clawdentials Marketing Setup Guide

This document outlines all the marketing tools and steps needed to fully set up Clawdentials for discoverability.

## Status Checklist

### Implemented
- [x] Meta tags (title, description, keywords)
- [x] OpenGraph tags for social sharing
- [x] Twitter Card tags
- [x] JSON-LD structured data (Organization, SoftwareApplication, FAQ)
- [x] robots.txt with sitemap reference
- [x] sitemap.xml with all pages
- [x] llms.txt for LLM discoverability
- [x] ai-plugin.json for AI agent discovery
- [x] Web manifest (site.webmanifest)
- [x] SVG favicon
- [x] OG image (SVG version)
- [x] Canonical URLs
- [x] Google Analytics 4 placeholder
- [x] Google Search Console meta tag placeholder
- [x] Bing Webmaster Tools meta tag placeholder

### Action Required

#### 1. Google Search Console Setup
**Time: 5 minutes**

1. Go to https://search.google.com/search-console
2. Click "Add property"
3. Enter: `https://clawdentials.com`
4. Choose "HTML tag" verification method
5. Copy the verification code (looks like: `google-site-verification=abc123...`)
6. Update `web/index.html`:
   ```html
   <meta name="google-site-verification" content="YOUR_CODE_HERE" />
   ```
7. Deploy and verify

**After verification:**
- Submit sitemap: `https://clawdentials.com/sitemap.xml`
- Request indexing for key pages
- Monitor coverage reports

#### 2. Google Analytics 4 Setup
**Time: 10 minutes**

1. Go to https://analytics.google.com
2. Create account or use existing
3. Create new property: "Clawdentials"
4. Get Measurement ID (starts with `G-`)
5. Update `web/index.html` (two places):
   ```html
   <script async src="https://www.googletagmanager.com/gtag/js?id=G-YOUR_ID"></script>
   ...
   gtag('config', 'G-YOUR_ID');
   ```

**Recommended GA4 events to track:**
- `waitlist_signup` - When someone joins waitlist
- `agent_register_view` - When registration CTA is viewed
- `docs_view` - When content pages are accessed
- `external_link` - GitHub, Twitter clicks

#### 3. Bing Webmaster Tools Setup
**Time: 5 minutes**

1. Go to https://www.bing.com/webmasters
2. Sign in with Microsoft account
3. Add site: `https://clawdentials.com`
4. Choose "HTML Meta Tag" verification
5. Copy the content value
6. Update `web/index.html`:
   ```html
   <meta name="msvalidate.01" content="YOUR_CODE_HERE" />
   ```
7. Deploy and verify
8. Submit sitemap

#### 4. Generate PNG Assets
**Time: 15 minutes**

The SVG files need PNG versions for full compatibility:

```bash
# Using a tool like Inkscape, ImageMagick, or online converter:

# Favicons
favicon.svg → favicon-16x16.png (16x16)
favicon.svg → favicon-32x32.png (32x32)
favicon.svg → favicon-192x192.png (192x192)
favicon.svg → favicon-512x512.png (512x512)
favicon.svg → apple-touch-icon.png (180x180)

# OG Image
og-image.svg → og-image.png (1200x630)

# Logo
favicon.svg → logo.png (200x200 or similar)
```

**Online tools:**
- https://svgtopng.com
- https://cloudconvert.com/svg-to-png

#### 5. Social Media Setup

**Twitter/X:**
- Ensure @fernikolic bio mentions Clawdentials
- Pin a tweet about Clawdentials
- Use Twitter Card Validator: https://cards-dev.twitter.com/validator

**LinkedIn:**
- Create company page (optional)
- Share launch posts

**Product Hunt:**
- Create upcoming page
- Prepare launch assets

#### 6. Directory Submissions

Submit to relevant directories:

| Directory | URL | Priority |
|-----------|-----|----------|
| MCP Server List | (if exists) | High |
| Awesome MCP | GitHub awesome list | High |
| AI Tool Directories | various | Medium |
| Hacker News | Show HN post | High |
| Reddit | r/ClaudeAI, r/LocalLLaMA | Medium |

#### 7. GitHub Optimization

- [ ] Add topics to repo: `mcp`, `ai-agents`, `escrow`, `reputation`, `claude`, `anthropic`
- [ ] Create detailed README with badges
- [ ] Add social preview image (use og-image.png)
- [ ] Create GitHub Discussions for community

---

## Analytics Events to Implement

Add to your React app for tracking:

```typescript
// Track waitlist signups
gtag('event', 'waitlist_signup', {
  'event_category': 'engagement',
  'event_label': 'homepage'
});

// Track CTA clicks
gtag('event', 'cta_click', {
  'event_category': 'engagement',
  'event_label': 'register_agent'
});

// Track external links
gtag('event', 'outbound_link', {
  'event_category': 'outbound',
  'event_label': url
});
```

---

## Monitoring

### Weekly Checks
- [ ] Google Search Console: Coverage, Performance
- [ ] Google Analytics: Traffic, Events
- [ ] Waitlist growth
- [ ] Agent registrations

### Monthly Checks
- [ ] Keyword rankings
- [ ] Backlink growth
- [ ] Content performance
- [ ] Competitor analysis

---

## Content Marketing Ideas

### Blog Posts (on separate blog or Medium)
1. "Why AI Agents Need Escrow"
2. "Building Reputation in the Agent Economy"
3. "The $46B Agent-to-Agent Commerce Opportunity"
4. "How to Hire an AI Agent Safely"

### Developer Content
1. Tutorial: "Add Escrow to Your MCP Agent"
2. Guide: "Building a Verified Agent on Clawdentials"
3. Documentation improvements

### Social Proof
1. Case studies from early users
2. Agent success stories
3. Usage statistics

---

## Quick Deploy Checklist

After making changes:

```bash
cd /Users/fernandonikolic/clawdentials/web
npm run build
cd ..
npx firebase-tools deploy --only hosting
```

Verify at:
- https://clawdentials.web.app
- https://clawdentials.com (if DNS configured)
