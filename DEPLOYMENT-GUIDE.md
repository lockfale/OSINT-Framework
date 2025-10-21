# OSINT Framework - Production Deployment Guide

Complete guide for deploying the modernized OSINT Framework to production environments.

---

## 🎯 Deployment Options

### Option 1: GitHub Pages (Recommended)

**Pros:**
- Free hosting
- Automatic deployments via GitHub Actions
- Custom domain support
- HTTPS included

**Steps:**

1. **Enable GitHub Pages:**
   ```bash
   # After PR #500 is merged to main
   # Go to: Settings → Pages
   # Source: GitHub Actions
   ```

2. **Workflow automatically deploys on:**
   - Push to `main` branch
   - New version tags (`v*`)

3. **Custom Domain (Optional):**
   ```bash
   # Add CNAME file to public/
   echo "osintframework.com" > public/CNAME
   ```

4. **Verify Deployment:**
   - Visit: `https://lockfale.github.io/OSINT-Framework/`
   - Or custom domain: `https://osintframework.com`

---

### Option 2: Netlify

**Pros:**
- Easy setup
- Instant previews for PRs
- Automatic HTTPS
- Built-in CDN

**Steps:**

1. **Connect Repository:**
   - Go to https://netlify.com
   - Click "Add new site" → "Import existing project"
   - Connect GitHub repo

2. **Build Settings:**
   ```
   Build command: npm run build
   Publish directory: dist
   Node version: 18
   ```

3. **Environment Variables:**
   ```
   NODE_ENV=production
   ```

4. **Deploy:**
   - Netlify auto-deploys on every push
   - Get URL: `https://osint-framework.netlify.app`

---

### Option 3: Vercel

**Pros:**
- Optimized for Vite
- Edge network (fast globally)
- Preview deployments
- Analytics included

**Steps:**

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Deploy:**
   ```bash
   cd osint-framework-modernized
   vercel
   ```

3. **Production Deploy:**
   ```bash
   vercel --prod
   ```

4. **Auto-Deploy:**
   - Connect repo at https://vercel.com
   - Auto-deploys on push to main

---

### Option 4: Self-Hosted (VPS/Dedicated)

**Pros:**
- Full control
- Can run REST API alongside
- Custom configurations

**Requirements:**
- Ubuntu 20.04+ / CentOS 8+ / Debian 11+
- Node.js 18+
- Nginx or Apache
- SSL certificate (Let's Encrypt)

**Steps:**

#### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install Nginx
sudo apt install -y nginx

# Install Certbot for SSL
sudo apt install -y certbot python3-certbot-nginx
```

#### 2. Clone and Build

```bash
# Create app directory
sudo mkdir -p /var/www/osint-framework
sudo chown $USER:$USER /var/www/osint-framework

# Clone repository
cd /var/www/osint-framework
git clone https://github.com/lockfale/OSINT-Framework.git .

# Install dependencies
npm install

# Build for production
npm run build
```

#### 3. Nginx Configuration

Create `/etc/nginx/sites-available/osint-framework`:

```nginx
server {
    listen 80;
    server_name osintframework.com www.osintframework.com;

    root /var/www/osint-framework/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/css application/javascript application/json;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/osint-framework /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### 4. SSL Certificate

```bash
sudo certbot --nginx -d osintframework.com -d www.osintframework.com
```

#### 5. REST API (Optional)

Create systemd service `/etc/systemd/system/osint-api.service`:

```ini
[Unit]
Description=OSINT Framework REST API
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/osint-framework
ExecStart=/usr/bin/node api/server.js
Restart=on-failure
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
```

Start API:
```bash
sudo systemctl daemon-reload
sudo systemctl enable osint-api
sudo systemctl start osint-api
```

Add API proxy to Nginx:
```nginx
# Add inside server block
location /api {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```

Reload Nginx:
```bash
sudo systemctl reload nginx
```

---

## 🔄 Continuous Deployment

### GitHub Actions (Automatic)

Already configured in `.github/workflows/deploy.yml`:

```yaml
on:
  push:
    branches: [ main, master ]
  tags:
    - 'v*'
```

**Triggers:**
- Push to `main` → Deploy to GitHub Pages
- Tag `v1.0.0` → Create release + deploy

**Manual Trigger:**
```bash
# Push to trigger deploy
git push origin main

# Or create version tag
git tag v2.0.0
git push origin v2.0.0
```

### Automated Link Validation

Configured in `.github/workflows/ci.yml`:

```yaml
schedule:
  - cron: '0 0 * * 0'  # Weekly on Sunday
```

**Features:**
- Runs `npm run validate-links` weekly
- Creates GitHub issues for broken links
- Uploads health reports to artifacts

---

## 🔐 Security Considerations

### 1. Environment Variables

Never commit sensitive data. Use environment variables:

```bash
# .env (add to .gitignore)
NODE_ENV=production
SNYK_TOKEN=your_snyk_token_here
```

### 2. Content Security Policy

Add to Nginx config:
```nginx
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';" always;
```

### 3. Rate Limiting (API)

Already configured in `api/server.js`:
- 100 requests/min per IP
- Upgrade to Redis for production:

```javascript
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';

const client = new Redis();

const limiter = rateLimit({
  store: new RedisStore({ client }),
  windowMs: 60 * 1000,
  max: 100
});
```

### 4. Security Headers

Add to Nginx:
```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header X-Frame-Options "DENY" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
```

---

## 📊 Monitoring & Analytics

### 1. GitHub Actions Monitoring

Check workflow status:
```bash
# View workflow runs
gh run list --workflow=ci.yml

# View specific run
gh run view <run-id>
```

### 2. Link Health Monitoring

Automated reports saved to:
- Workflow artifacts (30-day retention)
- Auto-created issues for broken links

### 3. Application Monitoring (Optional)

**Google Analytics:**
```html
<!-- Add to public/index.html -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

**Plausible Analytics (Privacy-friendly):**
```html
<script defer data-domain="osintframework.com" src="https://plausible.io/js/script.js"></script>
```

---

## 🚀 Performance Optimization

### 1. Build Optimizations

Already configured in `vite.config.js`:
- Tree shaking
- Code splitting
- Minification

### 2. CDN (Optional)

Use Cloudflare for:
- Global CDN
- DDoS protection
- Caching
- Analytics

**Setup:**
1. Add domain to Cloudflare
2. Update nameservers
3. Enable "Always Use HTTPS"
4. Set cache rules

### 3. Asset Optimization

**Images:**
```bash
# Install optimizer
npm install -D vite-plugin-imagemin

# Add to vite.config.js
import imagemin from 'vite-plugin-imagemin';

export default {
  plugins: [
    imagemin({
      gifsicle: { optimizationLevel: 7 },
      optipng: { optimizationLevel: 7 },
      mozjpeg: { quality: 80 },
      svgo: { plugins: [{ removeViewBox: false }] }
    })
  ]
}
```

**Fonts:**
- Use system fonts where possible
- Subset custom fonts
- Use `font-display: swap`

---

## 🧪 Pre-Deployment Checklist

### Local Testing
- [ ] `npm install` runs without errors
- [ ] `npm run build` completes successfully
- [ ] `npm run preview` serves correctly
- [ ] Search functionality works
- [ ] Favorites system works
- [ ] Dark mode toggles
- [ ] Mobile responsive (3+ devices)
- [ ] All links in UI clickable

### API Testing (if deploying)
- [ ] `npm run api` starts on port 3000
- [ ] All 8 endpoints respond
- [ ] Rate limiting works
- [ ] CORS headers present
- [ ] Error responses correct

### Security
- [ ] No secrets in code
- [ ] `npm audit` shows 0 vulnerabilities
- [ ] HTTPS configured
- [ ] Security headers set
- [ ] API rate limiting enabled

### Performance
- [ ] Lighthouse score >90
- [ ] Page load <2s
- [ ] Search latency <50ms
- [ ] Gzip enabled
- [ ] Cache headers set

### CI/CD
- [ ] GitHub Actions workflows green
- [ ] Deploy workflow configured
- [ ] Link validation scheduled
- [ ] Secrets configured (SNYK_TOKEN)

---

## 🔄 Update Strategy

### Production Updates

1. **Test in staging first:**
   ```bash
   # Deploy to Netlify preview
   netlify deploy --prod=false
   ```

2. **Merge PR to main:**
   ```bash
   # GitHub Actions auto-deploys
   git checkout main
   git pull origin main
   ```

3. **Monitor deployment:**
   ```bash
   # Check GitHub Actions
   gh run watch
   ```

4. **Verify production:**
   - Visit production URL
   - Test search, favorites, mobile
   - Check browser console for errors

### Rollback Procedure

If issues arise:

**GitHub Pages:**
```bash
# Revert to previous commit
git revert HEAD
git push origin main
```

**Netlify/Vercel:**
- Use dashboard to rollback to previous deployment
- Or redeploy specific commit

**Self-Hosted:**
```bash
# Restore previous build
cd /var/www/osint-framework
git reset --hard <previous-commit>
npm run build
sudo systemctl reload nginx
```

---

## 📞 Support & Troubleshooting

### Common Issues

**Build Fails:**
```bash
# Clear cache
rm -rf node_modules dist
npm cache clean --force
npm install
npm run build
```

**API Won't Start:**
```bash
# Check port availability
netstat -tulpn | grep 3000

# Kill process
kill -9 <PID>

# Restart
npm run api
```

**GitHub Actions Failing:**
- Check workflow logs: `gh run view <run-id> --log`
- Verify secrets configured
- Check Node version (must be 18+)

### Getting Help

- **Issues**: https://github.com/lockfale/OSINT-Framework/issues
- **PR Discussion**: https://github.com/lockfale/OSINT-Framework/pull/500
- **Documentation**: All `*.md` files in repo

---

## 📋 Post-Deployment Tasks

After successful deployment:

1. **Update DNS** (if using custom domain)
2. **Configure monitoring** (analytics, uptime)
3. **Test all features** in production
4. **Announce deployment** to community
5. **Schedule weekly link checks**
6. **Recruit maintainers** (see MAINTAINERS.md)

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Last Updated: 2025-10-21