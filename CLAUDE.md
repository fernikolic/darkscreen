# Clawdentials — Claude Code Context

## What Is This?

Clawdentials is the trust layer for the AI agent economy — providing escrow, reputation, and analytics infrastructure for agent commerce.

**Website:** clawdentials.com
**Status:** Pre-launch, building MVP

## Core Value Proposition

Skills are commodities (markdown files anyone can copy). Experience is the moat.

An agent with 5,000 verified task completions through Clawdentials has earned credibility that a fresh agent doesn't have. We're building the credentialing system for the agent economy.

## Tech Stack

| Component | Technology |
|-----------|------------|
| MCP Server | TypeScript, @modelcontextprotocol/sdk |
| Database | Firestore (project: perception-app-3db34) |
| Hosting | Cloudflare Pages |
| Payments | Manual → Stripe → x402/Lightning |

## Key Documentation

| File | Purpose |
|------|---------|
| docs/THESIS.md | Core thesis and value proposition |
| docs/BUSINESS-MODEL.md | Revenue streams, unit economics |
| docs/AUDIENCE.md | Target cohorts |
| docs/RISKS.md | Pitfalls and mitigations |
| docs/ROADMAP.md | Phases and milestones |
| docs/ARCHITECTURE.md | Technical design |
| docs/COMPETITIVE-LANDSCAPE.md | Market analysis |
| docs/RESEARCH.md | Background research |

## MCP Server Tools

### MVP (Phase 1)

| Tool | Description |
|------|-------------|
| `escrow_create` | Lock funds for a task |
| `escrow_complete` | Mark complete, release funds |
| `escrow_status` | Check escrow state |

### Phase 2

| Tool | Description |
|------|-------------|
| `escrow_dispute` | Flag for review |
| `agent_register` | Register as available agent |
| `agent_score` | Get reputation score |
| `agent_search` | Find agents by skill |

## Firestore Collections

```
agents/          → Registered agents and their stats
escrows/         → Escrow records (pending, completed, disputed)
tasks/           → Task queue and history
subscriptions/   → Paid tier subscriptions
```

## Related Projects

This project shares infrastructure with Perception:
- Same Firebase project (perception-app-3db34)
- Same GCP credentials
- Similar MCP server patterns

Reference `/Users/fernandonikolic/perception-monorepo/mcp-servers/` for MCP server patterns.

## Time Allocation

- **Perception:** 80% (Mon-Thu) — main business
- **Clawdentials:** 20% (Fridays) — future bet

## Current Phase

**Phase 1: Foundation**
- [ ] Domain registered
- [ ] MCP server scaffolded
- [ ] Firestore collections created
- [ ] 3 core tools built
- [ ] Basic testing

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
- [x402](https://x402.org) — Payment protocol
- [startwithbitcoin.com](https://startwithbitcoin.com) — Agent wallets
