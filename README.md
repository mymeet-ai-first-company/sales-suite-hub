# MyMeet Sales Suite Hub

> Static landing page for GitHub Pages deployment

## Structure

```
sales-suite-hub/
├── index.html          # Main page with 5 product tiles
├── styles/
│   └── main.css        # Non-critical CSS (async load)
├── images/             # AVIF/WebP images
│   └── (placeholder)
├── CNAME               # Custom domain (optional)
└── README.md           # This file
```

## Local Development

Simply open `index.html` in a browser:

```bash
# macOS
open index.html

# Linux
xdg-open index.html

# Or use a local server
python -m http.server 8000
# Then visit http://localhost:8000
```

## Deployment to GitHub Pages

### Option 1: Via GitHub UI

1. Create a new repository on GitHub (e.g., `mymeet-sales-suite-hub`)
2. Push this folder contents to the repo
3. Go to Settings → Pages
4. Source: Deploy from a branch
5. Branch: main, folder: / (root)
6. Save

### Option 2: Via CLI (Ready to use!)

Git is already initialized with the initial commit. Just add remote and push:

```bash
# Navigate to the folder
cd Dev/sales-suite-hub

# Add your GitHub remote (replace YOUR_USERNAME)
git remote add origin git@github.com:YOUR_USERNAME/mymeet-sales-suite-hub.git

# Push to GitHub
git push -u origin main
```

Then go to GitHub → Settings → Pages → Source: main branch.

### Custom Domain (optional)

1. Create a `CNAME` file with your domain:
   ```
   sales.mymeet.ai
   ```

2. Add DNS records:
   - A record: `185.199.108.153`
   - A record: `185.199.109.153`
   - A record: `185.199.110.153`
   - A record: `185.199.111.153`
   - Or CNAME: `your-username.github.io`

## Waitlist Form

The waitlist form uses Formspree.io for backend-less form handling:

1. Create a free account at [formspree.io](https://formspree.io)
2. Create a new form
3. Replace `YOUR_FORM_ID` in `index.html` with your form ID

## Performance Targets

- PageSpeed Score: 100/100
- LCP: < 2.5s
- CLS: < 0.1
- FID/INP: < 100ms

## Tech Stack

- Pure HTML5/CSS3/JS (no frameworks)
- System fonts only
- Formspree for form handling
- GitHub Pages for hosting

## Related Documentation

- [Landing Page Spec](../../Docs/Product/Spin-offs/Sales-Suite-Hub/landing-page-spec.md)
- [Hub README](../../Docs/Product/Spin-offs/Sales-Suite-Hub/README.md)

---

*MyMeet.ai © 2026*
