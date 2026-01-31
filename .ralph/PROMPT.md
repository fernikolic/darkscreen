# Clawdentials Development Instructions

## MANDATORY READING

Before doing ANY work, you MUST read and internalize these documents:

1. **CLAUDE.md** — Project overview, tech stack, current status
2. **docs/THESIS.md** — Core value proposition (Skills are commodities. Experience is the moat.)
3. **docs/ROADMAP.md** — Phases, milestones, deliverables with checkboxes
4. **docs/ARCHITECTURE.md** — Technical design, folder structure, data models
5. **docs/BUSINESS-MODEL.md** — Revenue streams, pricing tiers
6. **docs/RISKS.md** — What could go wrong, mitigations

These documents are the source of truth. Follow them exactly.

---

## Current Phase

Check `docs/ROADMAP.md` for the current phase and its deliverables. Work only on unchecked items (`[ ]`).

As of project setup, **Phase 1 is complete**. Focus on:

### Phase 2: First Agents (Weeks 3-4)

**Goal:** 10 agents registered, 20 tasks completed.

Deliverables:
- [ ] Listed on skills.sh
- [ ] 10 agents registered
- [ ] 20 tasks completed (seeded + organic)

### Phase 2 MCP Tools (from ARCHITECTURE.md)

Build these tools in `mcp-server/src/tools/`:

| Tool | Description | Status |
|------|-------------|--------|
| `escrow_dispute` | Flag escrow for review | Not started |
| `agent_register` | Register as available agent | Not started |
| `agent_score` | Get agent's reputation score | Not started |
| `agent_search` | Find agents by capability | Not started |

---

## Development Workflow

### Before Writing Code

1. Read the relevant existing code to understand patterns
2. Check `mcp-server/src/tools/escrow.ts` for tool implementation patterns
3. Check `mcp-server/src/schemas/` for Zod schema patterns
4. Check `mcp-server/src/services/firestore.ts` for database patterns

### When Building Each Tool

1. Add Zod schema in `mcp-server/src/schemas/`
2. Implement tool in `mcp-server/src/tools/`
3. Register tool in `mcp-server/src/index.ts`
4. Update Firestore service if needed
5. Run `npm run build` in `mcp-server/`
6. Run `npm test` in `mcp-server/`
7. Update `docs/ROADMAP.md` to check off completed items

### Code Standards

- TypeScript strict mode
- Zod for all input validation
- Follow existing naming conventions
- No over-engineering — simple solutions only
- Match the style of existing code exactly

---

## Firestore Collections

From `docs/ARCHITECTURE.md`, these are the data models:

```
agents/
├── {agent_id}/
│   ├── name: string
│   ├── description: string
│   ├── skills: string[]
│   ├── created_at: timestamp
│   ├── verified: boolean
│   ├── subscription_tier: 'free' | 'verified' | 'pro'
│   └── stats/
│       ├── tasks_completed: number
│       ├── total_earned: number
│       ├── success_rate: number
│       └── avg_completion_time: number

escrows/
├── {escrow_id}/
│   ├── status: 'pending' | 'in_progress' | 'completed' | 'disputed' | 'cancelled'
│   └── ... (see ARCHITECTURE.md for full schema)
```

---

## Constraints

### DO

- Follow the documentation exactly
- Build incrementally (one tool at a time)
- Test after each change
- Update ROADMAP.md checkboxes when completing tasks
- Keep implementations minimal and focused

### DO NOT

- Add features not in the roadmap
- Over-engineer or add "nice to haves"
- Skip reading existing code before writing new code
- Introduce new dependencies without justification
- Change the architecture without explicit direction

---

## Completion Criteria

A development session is complete when:

1. All Phase 2 MCP tools are implemented and tested
2. `npm run build` passes without errors
3. `npm test` passes
4. ROADMAP.md checkboxes are updated
5. Code follows existing patterns

Say "PHASE 2 COMPLETE" when all criteria are met.

---

## Kill Criteria

Stop and report if:

- Tests fail repeatedly after 3 fix attempts
- Build errors that can't be resolved
- Missing dependencies or credentials
- Unclear requirements (flag for human review)

---

## Session Continuity

If resuming from a previous session:

1. Run `git status` to see what changed
2. Run `npm run build` to check current state
3. Run `npm test` to see what's working
4. Read ROADMAP.md to see what's checked off
5. Continue from the next unchecked item

---

## Priority Order

Work on tasks in this order:

1. `agent_register` — Foundation for other agent tools
2. `agent_score` — Depends on agent existing
3. `agent_search` — Query registered agents
4. `escrow_dispute` — Extends existing escrow system

---

## Reference

The core thesis to keep in mind:

> "Skills are commodities (markdown files anyone can copy). Experience is the moat. An agent with 5,000 verified task completions through Clawdentials has earned credibility that a fresh agent doesn't have."

Everything we build serves this thesis.
