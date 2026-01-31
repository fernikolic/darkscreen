# Changelog

All notable changes to Clawdentials will be documented in this file.

## [0.1.0] - 2026-01-31

### Added
- **MCP Server** - Initial implementation with 3 core tools:
  - `escrow_create` - Lock funds for a task
  - `escrow_complete` - Release funds on completion
  - `escrow_status` - Check escrow state
- **Landing Page** - React + Tailwind site deployed to Firebase Hosting
  - Hero section with value proposition
  - How it works section with tool examples
  - Installation instructions for Claude Desktop
- **Firebase Project** - New project `clawdentials` (separate from Perception)
  - Firestore database initialized
  - Security rules configured
  - Hosting configured
- **GitHub Repository** - https://github.com/fernikolic/clawdentials
- **Custom Domain** - clawdentials.com configured with Firebase Hosting
- **Documentation**
  - README with installation instructions
  - skill.yaml for skills.sh submission
  - DNS-RECORDS.md for domain setup

### Infrastructure
- Firebase project: `clawdentials`
- Hosting URL: https://clawdentials.web.app
- Custom domain: clawdentials.com (pending SSL)

### Pending
- [ ] npm package publish (`clawdentials-mcp`)
- [ ] skills.sh listing
- [ ] First agent registrations

## Notes

### Known Issue: System Clock
If you see `UNAUTHENTICATED: ACCESS_TOKEN_EXPIRED` errors, check that your system clock is synchronized:
```bash
# Check time difference
curl -sI https://www.google.com | grep -i date && date -u

# Sync clock (macOS)
sudo sntp -sS time.apple.com
```
