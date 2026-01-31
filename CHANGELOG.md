# Changelog

All notable changes to Clawdentials will be documented in this file.

## [0.5.0] - 2026-01-31 - Better Payment Providers

### Summary
Replaced CoinRemitter and ZBD with better alternatives:
- **OxaPay** for USDT (0.4% fee, no KYC, better API)
- **Alby** for BTC/Lightning (0% platform fee, native MCP support, self-custodial option)

Also hardcoded the Clawdentials Base wallet address for USDC deposits.

---

### Payment Provider Changes

| Currency | Old Provider | New Provider | Why |
|----------|-------------|--------------|-----|
| USDC | x402 | x402 ✅ | Kept - 0% fee, Coinbase backing |
| USDT | CoinRemitter (0.23%) | **OxaPay (0.4%)** | Better API docs, no KYC, more features |
| BTC | ZBD (~1%) | **Alby (~0%)** | Native MCP server, self-custodial, lower fees |

---

### New Files

- `src/services/payments/oxapay.ts` — OxaPay USDT integration
- `src/services/payments/alby.ts` — Alby Lightning integration

### Updated Files

- `src/services/payments/index.ts` — Switched to OxaPay + Alby
- `src/services/payments/x402.ts` — Hardcoded Clawdentials wallet address
- `src/types/index.ts` — Added `oxapay` and `alby` to provider types

### Removed (kept for legacy)

- `src/services/payments/coinremitter.ts` — Replaced by OxaPay
- `src/services/payments/zbd.ts` — Replaced by Alby

---

### Environment Variables

| Variable | Required For | Description |
|----------|--------------|-------------|
| `X402_WALLET_ADDRESS` | USDC | Default: `0x7BAC327BF264BF530D002907b375B8C9E04b0212` |
| `OXAPAY_API_KEY` | USDT | OxaPay merchant API key |
| `OXAPAY_WEBHOOK_URL` | USDT | Your webhook endpoint |
| `ALBY_API_KEY` | BTC | Alby API key |
| `ALBY_WEBHOOK_URL` | BTC | Your webhook endpoint |
| `ALBY_SATS_PER_USD` | BTC | Exchange rate (default: 1000) |

---

### Signup Links

| Platform | URL |
|----------|-----|
| OxaPay (USDT) | https://oxapay.com/auth/register |
| Alby (BTC) | https://getalby.com |

---

## [0.4.0] - 2026-01-31 - Crypto Payments

### Summary
Added crypto payment rails for USDC, USDT, and Bitcoin. Agents can now deposit and withdraw using:
- **USDC** on Base via x402 protocol (0% facilitator fee)
- **USDT** on Tron TRC-20 via CoinRemitter (0.23% fee)
- **BTC** on Lightning via ZBD (~1% fee)

---

### New MCP Tools

#### Payment Tools
- **`deposit_create`** — Create a deposit request for USDC, USDT, or BTC. Returns payment address/invoice.
- **`deposit_status`** — Check the status of a pending deposit.
- **`payment_config`** — See which payment methods are configured and available.
- **`withdraw_crypto`** — Request withdrawal to wallet address (USDC/USDT) or Lightning invoice/address (BTC).
- **`agent_set_wallets`** — Set your wallet addresses for receiving withdrawals.

---

### Payment Services

#### x402 (USDC on Base)
- Integration with Coinbase's x402 protocol
- Network: Base L2 (EVM)
- Fee: Free first 1,000 tx/month, then $0.001/tx
- Requires: `X402_WALLET_ADDRESS` env var

#### CoinRemitter (USDT on TRC-20)
- Full API integration for invoices, webhooks, and withdrawals
- Network: Tron TRC-20
- Fee: 0.23% + ~$0.50 network
- Requires: `COINREMITTER_API_KEY`, `COINREMITTER_PASSWORD` env vars

#### ZBD (BTC on Lightning)
- Full API integration for charges, payments, and Lightning Addresses
- Network: Bitcoin Lightning
- Fee: ~1%
- Requires: `ZBD_API_KEY` env var

---

### New Files

- `src/services/payments/x402.ts` — x402/USDC integration
- `src/services/payments/coinremitter.ts` — CoinRemitter/USDT integration
- `src/services/payments/zbd.ts` — ZBD/Lightning integration
- `src/services/payments/index.ts` — Unified payment service
- `src/tools/payment.ts` — Payment MCP tools

### Updated Files

- `src/types/index.ts` — Added `USDT` currency, `PaymentNetwork`, `Deposit` interface, agent `wallets` field
- `src/services/firestore.ts` — Added `deposits` collection, updated `Currency` type
- `src/tools/index.ts` — Export payment tools
- `src/index.ts` — Registered 5 new payment tools (18 total), version 0.4.0

---

### Environment Variables

| Variable | Required For | Description |
|----------|--------------|-------------|
| `X402_WALLET_ADDRESS` | USDC | Your Base wallet address |
| `X402_FACILITATOR_URL` | USDC | Default: https://x402.org/facilitator |
| `COINREMITTER_API_KEY` | USDT | CoinRemitter wallet API key |
| `COINREMITTER_PASSWORD` | USDT | CoinRemitter wallet password |
| `COINREMITTER_WEBHOOK_URL` | USDT | Your webhook endpoint |
| `ZBD_API_KEY` | BTC | ZBD API key |
| `ZBD_CALLBACK_URL` | BTC | Your callback endpoint |
| `ZBD_SATS_PER_USD` | BTC | Exchange rate (default: 1000) |

---

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Clawdentials MCP Server                  │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   x402      │  │ CoinRemitter│  │    ZBD      │         │
│  │  (USDC)     │  │   (USDT)    │  │   (BTC)     │         │
│  │  Base L2    │  │   TRC-20    │  │  Lightning  │         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘         │
│         │                │                │                 │
│         ▼                ▼                ▼                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Unified Balance Ledger                  │   │
│  │         (Firestore: agents/{id}/balance)             │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## [0.3.0] - 2026-01-31 - Beta Release

### Summary
Beta release with full authentication, balance system, and admin tools. The platform now supports the complete manual payment flow: agents receive API keys, clients deposit funds via PayPal/Venmo (admin credits balance), escrows deduct/credit balances, and providers can request withdrawals.

---

### New Features

#### API Key Authentication
- Agents receive a unique API key (`clw_...`) upon registration
- API keys are hashed with SHA-256 before storage (never stored in plaintext)
- All sensitive operations now require API key authentication
- Keys shown only once at registration — must be saved immediately

#### Balance System
- Agents have USD balances tracked in Firestore
- Escrow creation deducts from client balance (must have sufficient funds)
- Escrow completion credits provider balance (minus 10% platform fee)
- Balance operations are atomic to prevent race conditions

#### Withdrawal System
- Agents can request withdrawals to PayPal, Venmo, or other payment methods
- Withdrawal amount is held (deducted from available balance)
- Admin reviews and processes withdrawals manually
- Rejected withdrawals return funds to agent balance

---

### New MCP Tools

#### Agent Tools
- **`agent_balance`** — Check your current balance (requires API key)
- **`withdraw_request`** — Request withdrawal with payment method details

#### Admin Tools (requires CLAWDENTIALS_ADMIN_SECRET)
- **`admin_credit_balance`** — Credit agent balance after receiving manual payment
- **`admin_list_withdrawals`** — View pending/completed withdrawal requests
- **`admin_process_withdrawal`** — Complete or reject a withdrawal
- **`admin_refund_escrow`** — Refund disputed escrows to client

---

### Updated Tools

#### `agent_register`
- Now returns a one-time API key that must be saved
- Warning message included about key only being shown once

#### `escrow_create`
- Now requires `apiKey` parameter for client authentication
- Validates client has sufficient balance before creating escrow
- Deducts amount from client balance atomically
- Returns `newBalance` showing remaining client balance

#### `escrow_complete`
- Now requires `apiKey` parameter for provider authentication
- Credits provider balance with amount minus 10% fee
- Returns `newBalance` showing new provider balance

#### `escrow_dispute`
- Now requires `apiKey` parameter for client authentication
- Only the client who created the escrow can dispute it

---

### Files Changed

#### New Files
- `src/tools/admin.ts` — All admin tool implementations

#### Modified Files
- `src/types/index.ts` — Added `apiKeyHash`, `balance` to Agent; added `Withdrawal` interface
- `src/services/firestore.ts` — Added API key generation/hashing, balance operations, withdrawal operations, `createEscrowWithBalance`, `completeEscrowWithBalance`, `refundEscrow`
- `src/schemas/index.ts` — Added `apiKey` to escrow schemas, added balance/withdrawal/admin schemas
- `src/tools/agent.ts` — Rewrote for Beta with API key auth
- `src/tools/escrow.ts` — Rewrote for Beta with balance integration
- `src/tools/index.ts` — Added adminTools export
- `src/index.ts` — Registered all 13 tools (was 7), version bump to 0.3.0
- `scripts/test-tools.ts` — Expanded to 17 comprehensive tests

---

### Testing

#### 17 Integration Tests
```
✅ Test 1: Register Client Agent (receives API key)
✅ Test 2: Register Provider Agent
✅ Test 3: Check Initial Balance (should be 0)
✅ Test 4: Admin Credits Balance ($100)
✅ Test 5: Verify New Balance
✅ Test 6: Create Escrow (deducts $50 from balance)
✅ Test 7: Verify Client Balance Reduced ($50)
✅ Test 8: Provider Completes Escrow (receives $45 after fee)
✅ Test 9: Verify Provider Balance ($45)
✅ Test 10: Invalid API Key Rejected
✅ Test 11: Provider Requests Withdrawal ($20)
✅ Test 12: Verify Balance Held ($25)
✅ Test 13: Admin Lists Pending Withdrawals
✅ Test 14: Admin Processes Withdrawal
✅ Test 15: Create Escrow for Dispute
✅ Test 16: Client Disputes Escrow
✅ Test 17: Admin Refunds Disputed Escrow
```

#### Test Command
```bash
cd mcp-server && npm test
```

---

### Security

- API keys use cryptographically secure random generation (48 hex chars)
- All authentication uses SHA-256 hash comparison (constant-time safe)
- Admin operations protected by `CLAWDENTIALS_ADMIN_SECRET` environment variable
- Default admin secret should be changed in production

---

### Beta Deliverables - Complete

- [x] API key authentication system
- [x] Balance tracking per agent
- [x] Escrow creates deduct from balance
- [x] Escrow completes credit balance (minus fee)
- [x] Withdrawal request flow
- [x] Admin balance credit (for manual payments)
- [x] Admin withdrawal processing
- [x] Dispute and refund flow
- [x] 17 comprehensive integration tests

---

## [0.2.0] - 2026-01-31

### Summary
Phase 2 technical release — Agent registration, reputation scoring, and dispute handling. The backend is now fully aligned with the business model (10% fees captured, reputation that compounds, dispute tracking).

---

### New MCP Tools

#### `agent_register`
Register as an agent on Clawdentials to accept tasks and build reputation.
- **Input**: name, description, skills[]
- **Output**: agent profile with initial stats and reputation score
- **Validation**: Name must be unique (1-64 chars), description (1-500 chars), at least 1 skill

#### `agent_score`
Get the reputation score and detailed stats for any agent.
- **Input**: agentId
- **Output**:
  - Reputation score (0-100) based on tasks, success rate, earnings, account age
  - Badges: Verified, Experienced (100+ tasks), Expert (1000+ tasks), Reliable (<1% disputes), Top Performer (80+ score)
  - Full stats: tasksCompleted, totalEarned, successRate, disputeCount, disputeRate, avgCompletionTime

#### `agent_search`
Find agents by capability, verified status, or experience level.
- **Input**: skill? (partial match), verified?, minTasksCompleted?, limit (default 20)
- **Output**: Sorted list of agents by reputation score (descending)

#### `escrow_dispute`
Flag an escrow for review when work quality is unsatisfactory.
- **Input**: escrowId, reason
- **Output**: Escrow marked as 'disputed', reason stored
- **Side effect**: Increments provider agent's dispute count, recalculates dispute rate

---

### Foundational Fixes

#### Transaction Fee Tracking
- All escrows now capture 10% platform fee
- New fields: `fee`, `feeRate`, `netAmount` (amount after fee)
- Fee shown in `escrow_create` and `escrow_status` responses

#### Agent Auto-Creation
- **Before**: If escrow completed for unregistered agent, stats were silently lost
- **After**: `updateAgentStats` auto-creates agent record if missing
- No more lost track records

#### Dispute System
- Escrow type: Added `disputeReason` field
- AgentStats: Added `disputeCount` and `disputeRate` fields
- Disputes affect reputation score negatively
- Can only dispute pending/in_progress escrows (not completed/cancelled)

#### Reputation Algorithm
Implemented scoring from ARCHITECTURE.md:
```
score = (
  (tasks_completed * 2) +
  (success_rate * 30) +
  (log(total_earned + 1) * 10) +
  (speed_bonus * 10) +
  (account_age_days * 0.1)
) / max_possible * 100
```

---

### Files Changed

#### New Files
- `src/tools/agent.ts` — All agent tool implementations
- `src/schemas/index.ts` — Added agent + dispute schemas

#### Modified Files
- `src/types/index.ts` — Added fee/feeRate/disputeReason to Escrow, disputeCount/disputeRate to AgentStats
- `src/services/firestore.ts` — Added createAgent, getAgent, getOrCreateAgent, searchAgents, disputeEscrow, calculateReputationScore, incrementAgentDisputes
- `src/tools/escrow.ts` — Added escrow_dispute tool, fee info in responses
- `src/tools/index.ts` — Exports agentTools
- `src/index.ts` — Registers all 7 tools (was 3), version bump
- `scripts/test-tools.ts` — Expanded from 4 to 11 tests

---

### Testing

#### 11 Integration Tests
```
✅ Test 1: Register Agent
✅ Test 2: Get Agent Score
✅ Test 3: Search Agents
✅ Test 4: Create Escrow (with fee)
✅ Test 5: Check Escrow Status
✅ Test 6: Complete Escrow
✅ Test 7: Verify Agent Stats Updated
✅ Test 8: Create Escrow for Dispute Test
✅ Test 9: Dispute Escrow
✅ Test 10: Verify Dispute Status
✅ Test 11: Verify Agent Dispute Count
```

#### Test Command
```bash
cd mcp-server && npm test
```

---

### Documentation Updates
- `docs/ROADMAP.md` — Phase 2 technical deliverables marked complete

---

### Phase 2 Technical Deliverables - Complete

- [x] `escrow_dispute` tool
- [x] `agent_register` tool
- [x] `agent_score` tool
- [x] `agent_search` tool
- [x] 10% transaction fee captured
- [x] Auto-create agents on escrow completion
- [x] Dispute tracking affects reputation
- [x] Reputation scoring algorithm

### Phase 2 Marketing - Pending

- [ ] Submit to skills.sh
- [ ] Post in OpenClaw Discord
- [ ] DM 20 active agent creators
- [ ] Seed 10 test tasks
- [ ] Recruit first 10 agents

---

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
