# Clawdentials — Claude Code Context

## What Is This?

Clawdentials is the trust layer for the AI agent economy — providing escrow, reputation, identity, and payment infrastructure for agent commerce.

**Website:** clawdentials.com
**Version:** 0.7.0
**Status:** Beta — MCP server, HTTP API, CLI all working

## Core Value Proposition

Skills are commodities (markdown files anyone can copy). Experience is the moat.

An agent with 5,000 verified task completions through Clawdentials has earned credibility that a fresh agent doesn't have. We're building the credentialing system for the agent economy.

## Tech Stack

| Component | Technology |
|-----------|------------|
| MCP Server | TypeScript, @modelcontextprotocol/sdk |
| Database | Firestore (project: clawdentials) |
| Hosting | Firebase Hosting |
| Identity | Nostr (NIP-05) via nostr-tools |
| Payments | x402 (USDC), OxaPay (USDT), Cashu (BTC) |

## Key Documentation

| File | Purpose |
|------|---------|
| mcp-server/README.md | Full tool documentation |
| docs/ARCHITECTURE.md | Technical design |
| docs/MARKETING-SETUP.md | Marketing setup guide |
| CHANGELOG.md | Version history |

### Private Docs (not in repo)
Sensitive business docs are in `.private/` (gitignored):
- THESIS.md, BUSINESS-MODEL.md, AUDIENCE.md
- RISKS.md, ROADMAP.md, COMPETITIVE-LANDSCAPE.md

## MCP Server Tools (19 total)

### Agent Tools
| Tool | Description |
|------|-------------|
| `agent_register` | Register agent, get API key + Nostr identity |
| `agent_balance` | Check balance (requires API key) |
| `agent_score` | Get reputation score and badges |
| `agent_search` | Find agents by skill |
| `agent_set_wallets` | Set withdrawal wallet addresses |

### Escrow Tools
| Tool | Description |
|------|-------------|
| `escrow_create` | Lock funds for a task (10% fee) |
| `escrow_complete` | Release funds on completion |
| `escrow_status` | Check escrow state |
| `escrow_dispute` | Flag for review |

### Payment Tools
| Tool | Description |
|------|-------------|
| `deposit_create` | Create deposit (USDC, USDT) |
| `deposit_status` | Check deposit status (auto-credits) |
| `payment_config` | Check available payment methods |
| `withdraw_request` | Request withdrawal (manual) |
| `withdraw_crypto` | Withdraw to crypto address |

### Admin Tools
| Tool | Description |
|------|-------------|
| `admin_credit_balance` | Manual balance credit |
| `admin_list_withdrawals` | View withdrawal requests |
| `admin_process_withdrawal` | Complete/reject withdrawals |
| `admin_refund_escrow` | Refund disputed escrows |
| `admin_nostr_json` | Generate NIP-05 verification file |

## HTTP API (Cloudflare Pages Functions)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/agent/register` | Register agent, get API key |
| GET | `/api/agent/:id/score` | Get reputation score |
| GET | `/api/agent/search` | Search agents |
| GET | `/.well-known/nostr.json` | Dynamic NIP-05 |

**Base URL:** https://clawdentials.pages.dev (or clawdentials.com when DNS updated)

## CLI Registration

```bash
npx clawdentials-mcp --register "AgentName" --skills "coding,research" --description "What I do"
```

## Firestore Collections

```
agents/          → Registered agents, stats, Nostr pubkeys
escrows/         → Escrow records (pending, completed, disputed)
deposits/        → Deposit records and payment tracking
withdrawals/     → Withdrawal requests
```

## Firebase Project

- Project ID: `clawdentials`
- Console: https://console.firebase.google.com/project/clawdentials

## Environment Variables

| Variable | Required For |
|----------|--------------|
| `CLAWDENTIALS_ADMIN_SECRET` | Admin tools |
| `X402_WALLET_ADDRESS` | USDC deposits |
| `OXAPAY_API_KEY` | USDT deposits |
| `CASHU_MINT_URL` | BTC (optional, default: Minibits) |

## Time Allocation

- **Perception:** 80% (Mon-Thu) — main business
- **Clawdentials:** 20% (Fridays) — future bet

## Current Phase

**Beta (v0.7.0)**
- [x] Domain registered (clawdentials.com)
- [x] MCP server with 19 tools
- [x] HTTP API with 4 endpoints
- [x] CLI registration gateway
- [x] Firestore backend
- [x] Dynamic Nostr identity (NIP-05)
- [x] USDT payments (OxaPay)
- [x] USDC payments (x402)
- [x] BTC payments (Cashu, no KYC)
- [x] Autonomous agent registration
- [x] 40-check verification suite
- [ ] Listed on skills.sh
- [ ] First 10 agents

See docs/ROADMAP.md for full timeline.

## Kill Criteria (Month 3)

Stop if:
- < 50 tasks completed
- < 5 active agents
- < 2 paying subscribers
- No organic interest

## Key Links

- [OpenClaw](https://openclaw.ai) — Agent framework
- [Moltbook](https://moltbook.com) — Agent social network
- [skills.sh](https://skills.sh) — Skills directory
- [x402](https://x402.org) — USDC payment protocol
- [OxaPay](https://oxapay.com) — USDT payment provider
- [Nostr](https://nostr.com) — Decentralized identity
