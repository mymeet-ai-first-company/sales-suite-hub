# MyMeet Suite

> Static Suite pages served by the lightweight Node server and production container.

## Structure

```
Suite/
├── index.html          # Main Suite page
├── desktop.html        # Mymeet.ai Desktop landing
├── desktop/
│   └── manual.html     # Desktop guide at /desktop/manual
├── server.js           # Static server with clean-URL support
├── styles/
│   └── main.css        # Non-critical CSS (async load)
├── scripts/            # Page interactions
├── images/             # Page assets
└── README.md           # This file
```

## Local Development

Run the same static server used by the production container:

```bash
PORT=8080 node server.js
```

Open `http://localhost:8080`, `http://localhost:8080/desktop`, or
`http://localhost:8080/desktop/manual`.

Run the built-in contracts with:

```bash
node --test
```

## Desktop download routes

The Windows CTAs use stable routes served by `server.js`:

- `/downloads/windows` and `/downloads/windows/x64` select the current x64 installer;
- `/downloads/windows/ia32` selects the current 32-bit installer.

The routes read the platform-specific release manifest at
`MyMeetAI/mymeet-desktop-releases/windows/latest.yml`, validate both architecture
mappings, and return a non-cacheable redirect to the installer. Successful manifest
reads are cached for five minutes and remain available as stale cache during a
temporary upstream failure.

Windows releases advance the landing page by updating `windows/latest.yml` in the
release repository. No landing-page edit is required for each release, and the
shared GitHub `/releases/latest` endpoint must not be used because macOS and Windows
releases coexist in that repository.

## Deployment

Production must run the included Node server because the API and stable Windows
download redirects are dynamic routes. Build and deploy the checked-in `Dockerfile`
through the repository's normal container workflow; it starts `server.js` on port
80. GitHub Pages can render the static HTML but is not a supported production
target because it cannot execute the API or download routes.

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
- Node 22 container for production hosting

## Related Documentation

- [Landing Page Spec](../../Docs/Product/Spin-offs/Sales-Suite-Hub/landing-page-spec.md)
- [Hub README](../../Docs/Product/Spin-offs/Sales-Suite-Hub/README.md)

---

*MyMeet.ai © 2026*
