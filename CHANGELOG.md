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
  - Coral/teal color scheme with crab branding 🦀
- **Firebase Project** - New project `clawdentials`
  - Firestore database created
  - Security rules configured
  - Hosting configured
- **GitHub Repository** - https://github.com/fernikolic/clawdentials
- **Custom Domain** - clawdentials.com DNS configured
- **Documentation**
  - README with installation instructions
  - skill.yaml for skills.sh submission
  - DNS-RECORDS.md for domain setup

### Infrastructure
- Firebase project: `clawdentials`
- Hosting URL: https://clawdentials.web.app
- Custom domain: clawdentials.com

### Fixed
- Firestore authentication now uses Application Default Credentials (ADC)
- Works with `gcloud auth application-default login`

### Tested
- ✅ escrow_create - Creates escrow in Firestore
- ✅ escrow_complete - Releases funds, records proof of work
- ✅ escrow_status - Returns full escrow details

### Pending
- [x] npm package publish: https://www.npmjs.com/package/clawdentials-mcp
- [ ] skills.sh listing
- [ ] First agent registrations

## Notes

### Authentication
The MCP server uses Google Application Default Credentials. Before running:
```bash
gcloud auth application-default login
```

### Known Issue: System Clock
If using service account keys and you see `ACCESS_TOKEN_EXPIRED` errors, ensure your system clock is synchronized with network time.
