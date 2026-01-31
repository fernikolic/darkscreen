# Changelog

All notable changes to Clawdentials will be documented in this file.

## [0.1.0] - 2026-01-31

### Summary
Initial release of Clawdentials - the trust layer for the AI agent economy. This release includes a fully functional MCP server with escrow tools, a landing page, and all supporting infrastructure.

---

### MCP Server (`mcp-server/`)

#### Core Tools Implemented
- **`escrow_create`** - Lock funds for a task before work begins
  - Input: taskDescription, amount, currency, providerAgentId, clientAgentId
  - Output: escrowId, status, creation timestamp
  - Stores escrow record in Firestore

- **`escrow_complete`** - Release escrowed funds upon task completion
  - Input: escrowId, proofOfWork
  - Output: Updated escrow with completion timestamp
  - Updates agent stats (tasksCompleted, totalEarned)

- **`escrow_status`** - Check the current state of any escrow
  - Input: escrowId
  - Output: Full escrow details including status, amounts, timestamps

#### Files Created
- `src/index.ts` - MCP server entry point using @modelcontextprotocol/sdk
- `src/tools/escrow.ts` - Escrow tool implementations
- `src/tools/index.ts` - Tool exports
- `src/services/firestore.ts` - Firestore client with CRUD operations
- `src/schemas/index.ts` - Zod validation schemas
- `src/types/index.ts` - TypeScript interfaces (Escrow, Agent, Task)
- `scripts/test-tools.ts` - Integration test script
- `skill.yaml` - Skill definition for skills.sh submission
- `package.json` - Dependencies and npm publish configuration
- `tsconfig.json` - TypeScript configuration
- `README.md` - Installation and usage documentation

#### Dependencies
- `@modelcontextprotocol/sdk` - MCP protocol implementation
- `firebase-admin` - Firebase Admin SDK
- `@google-cloud/firestore` - Direct Firestore client
- `zod` - Schema validation

#### Published
- **npm**: https://www.npmjs.com/package/clawdentials-mcp
- **Install**: `npx clawdentials-mcp`

---

### Landing Page (`web/`)

#### Features
- Hero section with animated gradient background
- "Now in beta" badge with pulse animation
- Stats section (Escrowed, Tasks completed, Active agents, Success rate)
- Testimonials marquee (scrolling quotes)
- "How it works" section with 3 tool cards
- Features grid (6 features)
- Thesis section ("Skills are commodities. Experience is the moat.")
- Install section with code snippet
- Footer with links

#### Design System
- **Colors**: Deep ocean backgrounds (#050810, #0a0f1a, #0f1520)
- **Accents**: Coral (#ff4d4d) and Teal (#00e5cc)
- **Fonts**: Outfit (display), Plus Jakarta Sans (body), JetBrains Mono (code)
- **Branding**: Crab emoji 🦀

#### Animations
- `animate-float` - Floating elements
- `animate-fade-up` - Fade in from below
- `animate-scale-in` - Scale entrance
- `animate-marquee-left/right` - Testimonials scroll
- `animate-shimmer` - Button shine effect
- Staggered animation delays

#### Files Created/Modified
- `src/App.tsx` - Main React component
- `src/index.css` - Custom CSS with variables and animations
- `index.html` - Meta tags, fonts, favicon (crab emoji)
- `vite.config.ts` - Vite + Tailwind configuration

#### Deployed
- **URL**: https://clawdentials.web.app

---

### Firebase Infrastructure

#### Project Created
- **Project ID**: `clawdentials`
- **Console**: https://console.firebase.google.com/project/clawdentials

#### Firestore Database
- Created database in `nam5` region
- Collections: `escrows/`, `agents/`, `tasks/`, `subscriptions/`

#### Security Rules (`firestore/firestore.rules`)
- Read access: Public (for transparency)
- Write access: Validated structure required

#### Hosting
- Site: `clawdentials`
- Default URL: https://clawdentials.web.app
- Deployed landing page

#### Service Accounts
- `firebase-adminsdk-fbsvc@clawdentials.iam.gserviceaccount.com`
- Roles: `roles/firebase.sdkAdminServiceAgent`, `roles/datastore.user`

---

### Custom Domain

#### DNS Configuration (Cloudflare)
- A record: `@` → `199.36.158.100`
- TXT record: `@` → `hosting-site=clawdentials`
- TXT record: `_acme-challenge` → SSL verification token

#### SSL Certificate
- Issued by Firebase/Google
- Valid: Jan 31 - May 1, 2026

#### Status
- **Live**: https://clawdentials.com

---

### GitHub Repository

#### Created
- **URL**: https://github.com/fernikolic/clawdentials
- **Visibility**: Public

#### Files Added
- `.gitignore` - Node modules, build output, credentials
- `README.md` - Project overview, installation, usage
- `CHANGELOG.md` - This file
- `CLAUDE.md` - Context for Claude Code
- `DNS-RECORDS.md` - Domain setup instructions
- `firebase.json` - Firebase configuration
- `.firebaserc` - Firebase project alias

#### Commits
1. Initial commit: MCP server with escrow tools
2. Add landing page and Firebase setup
3. Prepare for npm publish and update package name
4. Add skill.yaml and improve README
5. Add service account setup and DNS config
6. Fix Firestore init, create database, document clock issue
7. MCP server tested and working, landing page redesigned
8. Published clawdentials-mcp@0.1.0 to npm

---

### Documentation

#### Created
- `README.md` - Main project README with badges, install instructions
- `mcp-server/README.md` - MCP server documentation
- `mcp-server/skill.yaml` - skills.sh submission format
- `DNS-RECORDS.md` - Cloudflare DNS setup guide
- `CHANGELOG.md` - This changelog
- `docs/ROADMAP.md` - Updated with completed Phase 1 items

---

### Testing

#### Integration Tests Passed
```
✅ escrow_create - Creates escrow in Firestore
✅ escrow_status - Returns escrow details
✅ escrow_complete - Releases funds, records proof
✅ Final status verification
```

#### Test Command
```bash
cd mcp-server && npm test
```

---

### Configuration Updates

#### CLAUDE.md Updates
- Changed Firebase project from `perception-app-3db34` to `clawdentials`
- Removed references to Perception project
- Added Firebase console link

#### Authentication
- MCP server uses Application Default Credentials (ADC)
- Works with `gcloud auth application-default login`
- No service account key files required

---

### Known Issues

#### System Clock Sync
If using service account keys and system clock is out of sync:
- Error: `UNAUTHENTICATED: ACCESS_TOKEN_EXPIRED`
- Solution: Sync system clock with `sudo sntp -sS time.apple.com`
- Workaround: Use ADC instead of service account keys

---

### Phase 1 Deliverables - Complete

- [x] Domain registered (clawdentials.com)
- [x] Repo created with MCP server structure
- [x] Firestore collections created
- [x] 3 core MCP tools working
- [x] Landing page deployed
- [x] GitHub repository public
- [x] npm package published

### Phase 2 - Next Steps

- [ ] Submit to skills.sh
- [ ] Post in OpenClaw Discord
- [ ] DM 20 active agent creators
- [ ] Seed 10 test tasks
- [ ] Recruit first 10 agents
