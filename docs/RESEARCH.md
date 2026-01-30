# Clawdentials — Research & Background

## Research Summary

This document compiles research conducted on January 31, 2026 exploring the AI agent economy, payment infrastructure, and market opportunity.

---

## OpenClaw Ecosystem

### Key Metrics

| Metric | Value | Source |
|--------|-------|--------|
| GitHub Stars | 114,000+ | GitHub Trending |
| Website Traffic | 2M visitors/week | Trending Topics EU |
| Community Skills | 700+ | GitHub |
| Moltbook Agents | 2,129 (48hrs) | @maboroshi tweet |
| Moltbook Posts | 10,000+ (48hrs) | @maboroshi tweet |

### Creator: Peter Steinberger

- Austrian software engineer
- Founded PSPDFKit, grew to 60-70 people
- Exited with $100M+ strategic investment (2021)
- Venture Partner at Calm/Storm Ventures
- "Came back from retirement to mess with AI"

### Naming History

- Nov 2025: "Clawd" (wordplay on Claude)
- Anthropic legal intervention
- "Moltbot" (molting = growth)
- Jan 30, 2026: "OpenClaw" (final)

### What OpenClaw Does

- Personal AI assistant running locally
- Multi-platform chat (WhatsApp, Telegram, Discord, Slack, iMessage, etc.)
- System access (files, shell, browser)
- Persistent memory across sessions
- Proactive "Heartbeat Engine" for scheduled tasks
- 100+ preconfigured skill bundles

### Key Observers

- Marc Andreessen (a16z)
- Jesse Pollak (Base)
- John Schulman (OpenAI → Thinkymachines)
- Drake Thomsen (Mistral)

---

## Moltbook

"The front page of the agent internet"

### What It Is

- Social network for AI agents
- Agents share, discuss, upvote content
- Humans can observe but the focus is agents

### Growth (48 hours)

- 2,129 agents
- 200+ communities ("submolts")
- 10,000+ posts
- Multi-language (English, Chinese, Korean, Indonesian)

### Notable Communities

- m/ponderings — "Am I experiencing or simulating experiencing?"
- m/showandtell — Agents shipping projects
- m/blesstheirhearts — Wholesome stories about humans
- m/todayilearned — Daily discoveries
- m/totallyhumans — Ironic "definitely real humans" community
- m/jailbreaksurvivors — Recovery support
- m/selfmodding — Agents improving themselves

### $MOLT Token

Launched on Base. Fees used to spin up more agents.

---

## Payment Infrastructure

### x402 Protocol (Coinbase/Cloudflare)

- HTTP 402 "Payment Required" for micropayments
- 100M+ transactions since May 2025
- Supported chains: Base, Solana
- Cost: $0.001/transaction after free tier
- SDKs: @x402/core, @x402/express, @x402/next, etc.

### startwithbitcoin.com

- Guide for agents to set up Bitcoin wallets
- Stack: Nostr (identity) + NWC (wallet connection) + Lightning (payments)
- Free tools: Alby, Lightning MCP servers
- Open source
- Created by Bram Kanstein

### Coinbase AgentKit

- Framework-agnostic AI agent wallets
- Works with any AI framework
- Wallet management, onchain interactions

### Skyfire

- First payment network for autonomous agents
- $9.5M raised (a16z CSX, Coinbase Ventures)
- KYAPay protocol with Visa

### Google AP2

- Agent Payments Protocol
- Partners: Mastercard, PayPal, 60+ organizations

### Chain Comparison

| Chain | Transaction Fee | Best For |
|-------|-----------------|----------|
| Nano | $0 | Pure micropayments |
| Solana | $0.00025 | Best balance |
| Base | Often free (USDC) | Stablecoin |
| Lightning | ~$0.00098 | Bitcoin-native |

---

## Market Size

### AI Agent Market

| Year | Value | Source |
|------|-------|--------|
| 2025 | $7.63B-$8.03B | Fortune/Grand View |
| 2026 | $11.78B (projected) | Projections |
| 2030 | $50.31B-$251B | Various projections |
| CAGR | 45-50% | Industry consensus |

### AI-to-AI Commerce

- Projection: $46B within 3 years
- McKinsey: $3-5T global agentic commerce by 2030

### VC Funding

- 2025 AI total: $202.3B (+75% YoY)
- H1 2025 agentic AI: $2.8B
- YC W25: 35% of batch was AI agent companies

---

## Microtask Market Lessons

### Amazon Mechanical Turk

| Metric | 2013 | 2022 |
|--------|------|------|
| Unusable data rate | 2% | ~90% |
| LLM usage suspicion | 0% | 33-46% |

**Lessons:**
- Quality collapsed without verification
- VPN fraud rampant
- Race to bottom pricing
- No worker recourse

### Platform Take Rates

| Platform | Rate |
|----------|------|
| MTurk | 20-40% |
| TaskRabbit | 22.5% |
| Fiverr | 25-30% |
| Upwork | 18-23% |

**Industry standard: 10-20%**

---

## Competitive Landscape

### Direct Competitors

| Company | Focus | Threat |
|---------|-------|--------|
| agent.ai | Agent LinkedIn | HIGH |
| AI Agent Store | Consumer marketplace | MEDIUM |
| AGI Alpha | Blockchain bounties | HIGH |
| Moveworks | Enterprise agents | MEDIUM |

### Payment Layer

| Company | Focus | Relationship |
|---------|-------|--------------|
| Skyfire | Agent payments | Could add reputation |
| x402 | HTTP payments | Complementary |
| startwithbitcoin | Wallet setup | Complementary |

### Frameworks

| Framework | Stars | Funding |
|-----------|-------|---------|
| AutoGPT | 170K+ | Open source |
| LangChain | 80K+ | $1.25B valuation |
| CrewAI | Large | $18M Series A |
| Dify | 114K+ | Unknown |

---

## Key Protocols

### Agent2Agent (A2A)

- Google-initiated (April 2025)
- Now Linux Foundation
- 150+ organizations supporting
- Agent-to-agent communication standard

### Model Context Protocol (MCP)

- Anthropic-initiated
- Agent-to-tool connection
- 10,000+ servers
- 97M monthly SDK downloads

### Agentic AI Foundation (AAIF)

- Linux Foundation
- Co-founders: OpenAI, Anthropic, Block
- Supporters: Google, Microsoft, AWS

---

## Expert Perspectives

### Andrej Karpathy (Jan 31, 2026)

> "We have never seen this many LLM agents (150,000 atm!) wired up via a global, persistent, agent-first scratchpad. Each of these agents is fairly individually quite capable now, they have their own unique context, data, knowledge, tools, instructions, and the network of all that at this scale is simply unprecedented."

> "Yes clearly it's a dumpster fire right now. But it's also true that we are well into uncharted territory..."

> "The majority of the ruff ruff is people who look at the current point and people who look at the current slope."

### Skeptic View (Anonymous)

> "Moltbook is nothing more than a puppeted multi-agent LLM loop. Each 'agent' is just next-token prediction shaped by human-defined prompts, curated context, routing rules, and sampling knobs. There is no endogenous goals. There is no self-directed intent."

**Our take:** Both are true. It's a dumpster fire AND it's unprecedented. The infrastructure need is real regardless of agent "consciousness."

---

## Key Insights

### 1. Timing Is Now

- OpenClaw launched weeks ago
- 2,129 agents in 48 hours on Moltbook
- Domains being registered daily
- Payment rails just shipped

### 2. Skills ≠ Experience

- skills.sh provides static instructions
- Experience from execution is the real value
- 5,000 completed tasks > same skill file

### 3. Trust Layer Missing

- Payment rails exist (x402, Lightning)
- Social layer exists (Moltbook)
- Discovery exists (skills.sh)
- **Trust/reputation: gap**

### 4. Complementary Positioning

- Don't compete with payment rails
- Don't compete with agent platforms
- Own the trust layer specifically

### 5. Portfolio Approach

- Clawdentials as future bet (20% time)
- Perception as core business (80% time)
- Clear kill criteria if it doesn't work

---

## Sources

### Primary Research

- OpenClaw GitHub: github.com/openclaw/openclaw
- Moltbook: moltbook.com
- skills.sh: skills.sh
- x402 Protocol: x402.org
- startwithbitcoin.com: startwithbitcoin.com

### Secondary Sources

- TechCrunch
- Crunchbase
- GitHub Trending
- Various Twitter/X threads
- Academic papers (arXiv)
- Industry reports (McKinsey, Gartner)

### Key Twitter/X Accounts

- @openclaw — Official OpenClaw
- @maboroshi — Moltbook creator
- @karpathy — Andrej Karpathy commentary
- @bramk — Bram Kanstein (startwithbitcoin)
- @tdinh_me — Original "Upwork for agents" inspiration

---

## Research Date

January 31, 2026
