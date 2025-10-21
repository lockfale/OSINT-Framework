# Contributing to OSINT Framework

Thank you for contributing! This document provides guidelines for adding tools and submitting improvements.

## Quick Start

### Prerequisites
- Node.js >= 18.0.0
- Git

### Setup
```bash
git clone https://github.com/lockfale/OSINT-Framework.git
cd OSINT-Framework
npm install
npm run dev
```

## Adding New OSINT Tools

### Requirements
- Free or has free tier
- Publicly accessible
- No credit card required for basic features

### Steps

1. Edit `public/arf.json`
2. Find appropriate category
3. Add tool:

```json
{
  "name": "Tool Name",
  "type": "url",
  "url": "https://example.com"
}
```

### Notation

- `(T)` - Local installation required
- `(D)` - Google Dork
- `(R)` - Registration required
- `(M)` - Manual URL editing

### Validation

```bash
npm run lint
npm run validate-links
```

## PR Guidelines

### Checklist
- [ ] JSON valid
- [ ] Links working
- [ ] No duplicates
- [ ] Proper categorization
- [ ] Notation added if applicable

### PR Template

```markdown
## Description
Brief description

## Type
- [ ] New tool
- [ ] Bug fix
- [ ] Documentation

## Details
- Name:
- URL:
- Category:
- Free: Yes/No
```

## Reporting Issues

### Broken Links
```markdown
**Tool**: Name
**Category**: Path
**Issue**: Error description
**Fix**: Suggested solution
```

## Development Workflow

### Branch Naming
- `feature/tool-name`
- `fix/issue-description`
- `docs/update`

### Commits
```
feat(tools): add Sherlock username search
fix(links): remove broken VehicleHistory.com
docs(readme): update installation
```

## Code Quality

- Follow existing patterns
- Test locally before PR
- Update documentation
- Keep arf.json properly formatted

## Questions?

- Open issue: https://github.com/lockfale/OSINT-Framework/issues
- Twitter: @jnordine

---

For full documentation see README-MODERNIZATION.md
