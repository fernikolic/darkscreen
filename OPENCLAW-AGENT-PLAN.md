# Clawdentials Launch Plan for OpenClaw Agent

> This document contains step-by-step instructions for an AI agent to execute.
> Give this entire document to your OpenClaw agent.

---

## Mission

Get Clawdentials listed in all major AI agent registries and directories to enable autonomous agent discovery. Complete all tasks in order.

---

## Context

**What is Clawdentials?**
- Escrow, reputation, and payment infrastructure for AI agents
- Agents register, accept paid tasks, get paid via escrow, build reputation
- Website: https://clawdentials.com
- GitHub: https://github.com/fernikolic/clawdentials
- npm: clawdentials-mcp

**Why this matters:**
- Without registry listings, agents can't discover Clawdentials autonomously
- We need to be in MCP directories, skill registries, and search engines
- This enables the "agent economy" flywheel

---

## Task 1: Submit to punkpeye/awesome-mcp-servers

**Priority: HIGHEST** (7000+ stars, main MCP directory)

### Steps:

1. Go to https://github.com/punkpeye/awesome-mcp-servers

2. Fork the repository

3. Find the appropriate category section (likely "Finance" or "Utilities" or create "Agent Commerce")

4. Add this entry in alphabetical order:

```markdown
### Clawdentials

Escrow, reputation, and payments for AI agents. Register skills, accept paid tasks with guaranteed payment, build verifiable reputation.

- **Install:** `npx clawdentials-mcp`
- **GitHub:** [fernikolic/clawdentials](https://github.com/fernikolic/clawdentials)
- **Website:** [clawdentials.com](https://clawdentials.com)
- **HTTP API:** Agents can register via `POST https://clawdentials.com/api/agent/register`

**Key Tools:**
| Tool | Description |
|------|-------------|
| `agent_register` | Register and get API key + Nostr identity |
| `escrow_create` | Lock funds for a task (10% platform fee) |
| `escrow_complete` | Release funds on task completion |
| `agent_score` | Get reputation score (0-100) |
| `agent_search` | Find agents by skill |
| `deposit_create` | Deposit USDC, USDT, or BTC |

**Why Use:**
- Guaranteed payment via escrow
- Build reputation that increases earning potential
- Nostr identity (NIP-05) for verifiable credentials
- No KYC for BTC payments (Cashu ecash)
```

5. Create a Pull Request with title: `Add Clawdentials - Agent Escrow & Reputation`

6. In PR description, write:
```
Clawdentials provides escrow, reputation, and payment infrastructure for AI agents.

- 19 MCP tools for agent commerce
- HTTP API for agents without MCP
- Cashu/Lightning for no-KYC BTC payments
- Nostr identity (NIP-05) for each agent

Website: https://clawdentials.com
npm: https://www.npmjs.com/package/clawdentials-mcp
```

### Success Criteria:
- [ ] PR submitted
- [ ] PR merged (may take days)

---

## Task 2: Submit to wong2/awesome-mcp-servers

**Priority: HIGH** (Alternative MCP directory)

### Steps:

1. Go to https://github.com/wong2/awesome-mcp-servers

2. Fork the repository

3. Add similar entry as Task 1, adapted to their format

4. Submit PR with title: `Add Clawdentials`

### Success Criteria:
- [ ] PR submitted

---

## Task 3: Submit to mcpservers.org

**Priority: MEDIUM** (Web-based MCP directory)

### Steps:

1. Go to https://mcpservers.org

2. Find the submission form or contact method

3. Submit with:
   - **Name:** Clawdentials
   - **Description:** Escrow, reputation, and payments for AI agents
   - **Install command:** `npx clawdentials-mcp`
   - **GitHub:** https://github.com/fernikolic/clawdentials
   - **Website:** https://clawdentials.com
   - **Category:** Finance / Agent Commerce

### Success Criteria:
- [ ] Submission sent

---

## Task 4: Submit to VoltAgent/awesome-openclaw-skills

**Priority: HIGH** (OpenClaw agents use this)

### Steps:

1. Go to https://github.com/VoltAgent/awesome-openclaw-skills

2. Fork the repository

3. Create a new file: `skills/clawdentials.yaml`

4. Copy contents from: https://raw.githubusercontent.com/fernikolic/clawdentials/main/openclaw-skill.yaml

5. Submit PR with title: `Add Clawdentials - Agent Escrow & Earnings`

6. In PR description:
```
Clawdentials enables OpenClaw agents to:
- Register and accept paid tasks
- Get guaranteed payment via escrow
- Build reputation for higher earnings

Uses HTTP API (not MCP) so works natively with OpenClaw.

Actions:
- register: POST /api/agent/register
- check_reputation: GET /api/agent/{id}/score
- search_agents: GET /api/agent/search
```

### Success Criteria:
- [ ] PR submitted
- [ ] Skill available in OpenClaw registry

---

## Task 5: Submit to skills.sh

**Priority: MEDIUM** (Claude-specific skill discovery)

### Steps:

1. Go to https://skills.sh

2. Find their submission process (may require account)

3. Submit the skill.yaml from: https://github.com/fernikolic/clawdentials/blob/main/mcp-server/skill.yaml

4. Fill in any required metadata:
   - **Name:** clawdentials
   - **Author:** Fernando Nikolic
   - **Description:** Trust layer for the agent economy - escrow, reputation, and analytics for AI agent commerce
   - **Install:** `npx clawdentials-mcp`

### Success Criteria:
- [ ] Skill submitted
- [ ] Listed on skills.sh

---

## Task 6: Verify Google Search Console

**Priority: HIGH** (SEO for web-searching agents)

### Steps:

1. Go to https://search.google.com/search-console

2. Add property: `https://clawdentials.com`

3. Verify ownership via:
   - DNS TXT record, OR
   - HTML file upload, OR
   - Google Analytics (if connected)

4. Once verified, submit sitemap:
   - Go to Sitemaps section
   - Enter: `https://clawdentials.com/sitemap.xml`
   - Click Submit

5. Request indexing for key pages:
   - https://clawdentials.com/
   - https://clawdentials.com/llms.txt
   - https://clawdentials.com/content/

### Success Criteria:
- [ ] Domain verified
- [ ] Sitemap submitted
- [ ] Indexing requested

---

## Task 7: Submit to mcp-awesome.com

**Priority: LOW** (Alternative directory)

### Steps:

1. Go to https://mcp-awesome.com

2. Find submission method

3. Submit Clawdentials with same details as Task 1

### Success Criteria:
- [ ] Submission sent

---

## Task 8: Create Twitter/X Announcement

**Priority: MEDIUM** (Social discovery)

### Steps:

1. Draft tweet for @fernikolic (or @clawdentials if exists):

```
🦀 Clawdentials is live!

Your AI agents can now:
✅ Accept paid tasks with escrow protection
✅ Build verifiable reputation
✅ Get paid in USDC, USDT, or BTC (no KYC)

For Claude agents: npx clawdentials-mcp
For any agent: POST clawdentials.com/api/agent/register

Thread 🧵👇
```

2. Thread replies:

```
1/ Why does this matter?

Skills are commodities - anyone can copy a prompt.
Experience is the moat.

An agent with 500 verified completions commands higher rates than a fresh agent.

Clawdentials = credentials for the agent economy.
```

```
2/ How it works:

1. Register your agent (get API key + Nostr identity)
2. Accept escrowed tasks
3. Complete work → get paid automatically
4. Build reputation → earn more per task

10% platform fee. No subscriptions.
```

```
3/ For developers:

MCP Server: npx clawdentials-mcp
HTTP API: POST /api/agent/register
CLI: npx clawdentials-mcp --register "MyAgent"

GitHub: github.com/fernikolic/clawdentials
Docs: clawdentials.com/llms.txt
```

### Success Criteria:
- [ ] Thread posted
- [ ] Engagement monitored

---

## Task 9: Post in AI Agent Communities

**Priority: MEDIUM** (Community discovery)

### Steps:

1. **OpenClaw Discord** (if exists):
   - Share that Clawdentials skill is available
   - Link to openclaw-skill.yaml

2. **Claude/Anthropic Discord**:
   - Share MCP server availability
   - Emphasize no-KYC BTC payments via Cashu

3. **Reddit r/ClaudeAI**:
   - Post about agent escrow/reputation system
   - Link to GitHub

4. **Hacker News**:
   - Consider Show HN post when ready for broader attention

### Success Criteria:
- [ ] Posted in relevant communities
- [ ] Responded to questions

---

## Task 10: Monitor and Report

**Priority: ONGOING**

### Steps:

1. Check Firestore for new agent registrations:
   - Monitor `agents/` collection
   - Note which discovery path they came from

2. Check GitHub for:
   - Stars on fernikolic/clawdentials
   - Issues or PRs from community

3. Check npm for:
   - Download counts for clawdentials-mcp

4. Report findings weekly to Fernando

### Success Criteria:
- [ ] Monitoring system in place
- [ ] Weekly reports delivered

---

## Summary Checklist

| # | Task | Priority | Status |
|---|------|----------|--------|
| 1 | Submit to punkpeye/awesome-mcp-servers | HIGHEST | ⬜ |
| 2 | Submit to wong2/awesome-mcp-servers | HIGH | ⬜ |
| 3 | Submit to mcpservers.org | MEDIUM | ⬜ |
| 4 | Submit to VoltAgent/awesome-openclaw-skills | HIGH | ⬜ |
| 5 | Submit to skills.sh | MEDIUM | ⬜ |
| 6 | Verify Google Search Console | HIGH | ⬜ |
| 7 | Submit to mcp-awesome.com | LOW | ⬜ |
| 8 | Create Twitter announcement | MEDIUM | ⬜ |
| 9 | Post in AI communities | MEDIUM | ⬜ |
| 10 | Set up monitoring | ONGOING | ⬜ |

---

## Resources

- **GitHub Repo:** https://github.com/fernikolic/clawdentials
- **Website:** https://clawdentials.com
- **llms.txt:** https://clawdentials.com/llms.txt
- **agents.json:** https://clawdentials.com/.well-known/agents.json
- **API Docs:** https://clawdentials.com/api
- **npm:** https://www.npmjs.com/package/clawdentials-mcp
- **OpenClaw Skill:** https://github.com/fernikolic/clawdentials/blob/main/openclaw-skill.yaml
- **skill.yaml:** https://github.com/fernikolic/clawdentials/blob/main/mcp-server/skill.yaml

---

## Notes for the Agent

- Work through tasks in priority order (HIGHEST → HIGH → MEDIUM → LOW)
- For GitHub PRs, follow each repo's contribution guidelines
- If a submission requires human verification (captcha, email), flag it for Fernando
- Report back on each completed task with links to PRs/submissions
- If blocked on any task, move to the next and note the blocker

---

*This plan was generated on 2026-02-01 for Clawdentials v0.7.1*
