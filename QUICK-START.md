# OSINT Framework Modernization - Quick Start Guide

## 🚀 Installation & Setup

### Prerequisites
- Node.js 18+ ([Download](https://nodejs.org/))
- Git
- Modern web browser

### Option 1: Clone from Fork (Recommended for Testing)

```bash
# Clone the modernized fork
git clone https://github.com/Scarmonit/OSINT-Framework.git
cd OSINT-Framework

# Switch to modernization branch
git checkout modernization

# Install dependencies
npm install

# Start development server
npm run dev
```

Open http://localhost:8000 in your browser.

### Option 2: Clone from Original (After PR Merge)

```bash
# Clone original repo
git clone https://github.com/lockfale/OSINT-Framework.git
cd OSINT-Framework

# Install dependencies
npm install

# Start development server
npm run dev
```

---

## ✨ Feature Demos

### 1. Search Functionality

**Try it:**
1. Open http://localhost:8000
2. Type in search box: `github`
3. Click on a result from dropdown
4. Watch tree expand and highlight the tool

**Advanced searches:**
- `email` - Find all email-related tools
- `sherlock` - Find specific tool (fuzzy matching)
- `username` - Category-based search

### 2. Favorites System

**Try it:**
1. Look for the ⭐ Favorites button (top-right)
2. Click to open favorites panel
3. Browse tree and favorite tools (feature pending in UI integration)
4. Export your collection:
   - Click "Export JSON"
   - Click "Export MD" for Markdown
   - Click "Export CSV" for spreadsheet

**Import favorites:**
1. Click "Import" button
2. Select a previously exported JSON file
3. Favorites merge automatically

### 3. Mobile Responsive Design

**Try it:**
1. Open http://localhost:8000
2. Open Chrome DevTools (F12)
3. Click device toolbar icon (Ctrl+Shift+M)
4. Test on:
   - iPhone 12 (390x844)
   - iPad (768x1024)
   - Desktop (1920x1080)

**Touch features:**
- 44px minimum tap targets
- No iOS zoom on input focus
- Visual tap feedback
- Landscape/portrait support

### 4. REST API

**Start the API:**
```bash
npm run api
# Server starts on http://localhost:3000
```

**Try these endpoints:**

**Health Check:**
```bash
curl http://localhost:3000/api/health
```

**Search for tools:**
```bash
curl "http://localhost:3000/api/search?q=github&limit=5"
```

**Get statistics:**
```bash
curl http://localhost:3000/api/stats
```

**Get all categories:**
```bash
curl http://localhost:3000/api/categories
```

**Filter by category:**
```bash
curl "http://localhost:3000/api/tools?category=username&limit=10"
```

### 5. Automated Link Validation

**Run validator:**
```bash
npm run validate-links
```

**Output:**
```
🔍 OSINT Framework Link Validator

Found 1360 URLs to validate

✓ Sherlock (T)
✓ WhatsMyName
✗ VehicleHistory.com (404)
...

============================================================
VALIDATION SUMMARY
============================================================
Total URLs: 1360
✓ Working: 1180
✗ Broken: 42
⊘ Skipped: 138
Health Score: 96.56%
============================================================

📊 Report saved to: reports/link-health.json
```

**View report:**
```bash
cat reports/link-health.json
```

### 6. Build for Production

**Create production build:**
```bash
npm run build
```

**Preview production build:**
```bash
npm run preview
```

**Deploy files from `dist/` directory to your hosting:**
- GitHub Pages
- Netlify
- Vercel
- Any static host

---

## 🛠️ Available Commands

### Development
```bash
npm run dev              # Start dev server (Vite)
npm run build            # Build for production
npm run preview          # Preview production build
npm run api              # Start REST API server
```

### Validation & Testing
```bash
npm run validate-links   # Check all tool links
npm test                 # Run test suite (if available)
npm run lint             # Check code quality
npm run format           # Auto-format code
```

### CI/CD (Automated on GitHub)
- Weekly link validation (Sunday 00:00 UTC)
- Security audits on every push
- Auto-deploy to GitHub Pages on merge

---

## 📱 Mobile Testing Checklist

**iOS Safari:**
- [ ] No zoom on input focus (16px font)
- [ ] Touch targets ≥44px
- [ ] Smooth scrolling
- [ ] Dark mode toggle works

**Android Chrome:**
- [ ] Touch targets ≥48dp
- [ ] Material ripple effects
- [ ] Viewport renders correctly

**Responsive Breakpoints:**
- [ ] Desktop (≥1024px) - Full layout
- [ ] Tablet (768-1024px) - Adjusted layout
- [ ] Mobile Landscape (480-768px) - Vertical layout
- [ ] Mobile Portrait (≤480px) - Compact layout

---

## 🔧 Troubleshooting

### Port Already in Use
```bash
# If port 8000 is busy
# Vite will automatically use next available port
# Or specify custom port:
vite --port 8001
```

### Dependencies Not Installing
```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

### Search Not Working
1. Check browser console (F12)
2. Verify `arf.json` loaded successfully
3. Check Fuse.js import in `arf-modernized.js`

### Favorites Not Saving
1. Check localStorage is enabled in browser
2. Test in incognito/private mode
3. Check browser console for errors

### API Not Starting
```bash
# Check if port 3000 is available
netstat -ano | findstr :3000  # Windows
lsof -i :3000                  # Mac/Linux

# Kill process if needed (Windows)
taskkill /F /PID <PID>

# Kill process if needed (Mac/Linux)
kill -9 <PID>
```

---

## 📊 Performance Benchmarks

Run these to verify performance:

### Page Load Speed
1. Open DevTools → Network tab
2. Disable cache
3. Refresh page
4. Check DOMContentLoaded time
   - **Target**: <1.5s

### Search Latency
1. Open DevTools → Console
2. Type in search box
3. Check time to first result
   - **Target**: <50ms

### Mobile Performance
1. Open DevTools → Lighthouse
2. Run Mobile audit
3. Check scores:
   - **Performance**: >90
   - **Accessibility**: >95
   - **Best Practices**: >90
   - **SEO**: >90

---

## 🎯 Next Steps

### For Users
1. ✅ Browse and search 1,360+ OSINT tools
2. ✅ Save favorites and export collections
3. ✅ Use on mobile devices
4. ✅ Integrate via REST API

### For Contributors
1. Read `CONTRIBUTING.md`
2. Submit tool additions via PR
3. Report broken links via issues
4. Improve documentation

### For Maintainers
1. Review `MAINTAINERS.md`
2. Apply for maintainer role
3. Help with PR reviews
4. Run weekly link validations

---

## 📚 Additional Resources

- **Full Documentation**: `README-MODERNIZATION.md`
- **API Documentation**: `api/README.md`
- **Phase 2 Summary**: `PHASE2-SUMMARY.md`
- **Deployment Guide**: `DEPLOYMENT-GUIDE.md`
- **Contributing**: `CONTRIBUTING.md`
- **Maintainers**: `MAINTAINERS.md`

---

## 🤝 Support

- **Issues**: https://github.com/lockfale/OSINT-Framework/issues
- **Pull Request**: https://github.com/lockfale/OSINT-Framework/pull/500
- **Original Maintainer**: @jnordine
- **Modernization Author**: @Scarmonit

---

## ✅ Verification Checklist

After setup, verify these work:

**Phase 1 Features:**
- [ ] Development server starts on port 8000
- [ ] Search box appears in header
- [ ] Typing in search shows results
- [ ] Clicking result expands tree
- [ ] Link validation script runs
- [ ] Dark mode toggle works

**Phase 2 Features:**
- [ ] Favorites button visible (top-right)
- [ ] Favorites panel opens/closes
- [ ] Export to JSON/MD/CSV works
- [ ] Mobile viewport renders correctly
- [ ] REST API responds on port 3000
- [ ] Touch targets ≥44px on mobile

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Last Updated: 2025-10-21