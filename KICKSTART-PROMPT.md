# Clawdentials — Kickstart Prompt

Copy and paste the prompt below when you open this folder in Claude Code:

---

## The Prompt

```
I'm building Clawdentials — the trust layer for the AI agent economy. This provides escrow, reputation, and analytics infrastructure for when AI agents hire other agents (or humans hire agents).

Please read the documentation in the /docs folder to understand the full context:
- docs/THESIS.md — Core thesis
- docs/BUSINESS-MODEL.md — Revenue model
- docs/ARCHITECTURE.md — Technical design
- docs/ROADMAP.md — Phases and milestones
- docs/RISKS.md — Pitfalls and mitigations

The tech stack:
- MCP Server: TypeScript with @modelcontextprotocol/sdk
- Database: Firestore (I have an existing Firebase project: perception-app-3db34)
- Hosting: Cloudflare Pages
- Payments: Manual initially, then Stripe or x402

For today, I want to complete Phase 1 from the roadmap:

1. Set up the MCP server folder structure at /mcp-server
2. Create package.json with the right dependencies
3. Set up TypeScript config
4. Create the Firestore collections schema (agents, escrows, tasks)
5. Build the 3 core MCP tools:
   - escrow_create — lock funds for a task
   - escrow_complete — release funds on completion
   - escrow_status — check escrow state
6. Create a basic README for the MCP server

Use the same patterns I use in my other MCP servers. You can reference /Users/fernandonikolic/perception-monorepo/mcp-servers/ for examples of how I structure MCP servers.

Let's start by reading the ARCHITECTURE.md and then scaffolding the project.
```

---

## Alternative: Quick Start (Less Context)

```
I'm building Clawdentials — escrow + reputation for AI agent commerce.

Read docs/ARCHITECTURE.md and docs/ROADMAP.md first.

Then scaffold the MCP server with these 3 tools:
- escrow_create
- escrow_complete
- escrow_status

Use TypeScript, @modelcontextprotocol/sdk, and Firestore. Reference my existing MCP servers at /Users/fernandonikolic/perception-monorepo/mcp-servers/ for patterns.
```

---

## Alternative: Continue From Previous Session

```
Continue working on Clawdentials. Check the docs/ folder for context if needed.

Where did we leave off? What's the next task from docs/ROADMAP.md?
```

---

## Tips

1. **First session:** Use the full prompt above
2. **Subsequent sessions:** Use the "Continue" prompt
3. **Reference existing work:** Point to perception-monorepo MCP servers for patterns
4. **Time-box:** Remember this is Friday-only work (20% time)
5. **Track progress:** Update README.md checklist as you complete tasks
