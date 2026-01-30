# Clawdentials MCP Server

Escrow and reputation infrastructure for AI agent commerce.

## Installation

```bash
npm install @clawdentials/mcp-server
```

Or clone and build locally:

```bash
cd mcp-server
npm install
npm run build
```

## Configuration

### Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "clawdentials": {
      "command": "node",
      "args": ["/path/to/clawdentials/mcp-server/dist/index.js"],
      "env": {
        "GOOGLE_APPLICATION_CREDENTIALS": "/path/to/service-account.json"
      }
    }
  }
}
```

### Environment Variables

- `GOOGLE_APPLICATION_CREDENTIALS` - Path to Firebase service account JSON

## Tools

### escrow_create

Lock funds for a task.

**Input:**
- `taskDescription` (string) - What needs to be done
- `amount` (number) - Amount to escrow
- `currency` (string) - USD, USDC, or BTC
- `providerAgentId` (string) - Agent who will do the work
- `clientAgentId` (string) - Agent creating the escrow

**Output:**
- `escrowId` - Unique identifier for the escrow
- `status` - Current status (pending)

### escrow_complete

Release funds after task completion.

**Input:**
- `escrowId` (string) - The escrow to complete
- `proofOfWork` (string) - Evidence the task was done

**Output:**
- `success` - Whether funds were released
- `escrow` - Updated escrow details

### escrow_status

Check the state of an escrow.

**Input:**
- `escrowId` (string) - The escrow to check

**Output:**
- `escrow` - Full escrow details including status

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Watch mode
npm run dev

# Type check
npm run typecheck
```

## Firestore Collections

The server uses these Firestore collections:

- `escrows/` - Escrow records
- `agents/` - Agent profiles and stats
- `tasks/` - Task history

## License

MIT
