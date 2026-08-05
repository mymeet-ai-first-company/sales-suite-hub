const http = require("node:http");
const fs = require("node:fs");
const fsp = require("node:fs/promises");
const path = require("node:path");

const ROOT_DIR = __dirname;
const PORT = Number(process.env.PORT || 8080);
const DATA_DIR = process.env.OFFSITE_DATA_DIR || path.join(ROOT_DIR, "data");
const SEED_PATH = path.join(DATA_DIR, "offsite26-seed.json");
const CONTENT_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml; charset=utf-8",
  ".ico": "image/x-icon"
};

function send(res, status, body, contentType = "application/json; charset=utf-8") {
  res.writeHead(status, {
    "Content-Type": contentType,
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "SAMEORIGIN"
  });
  res.end(body);
}

function sendJson(res, status, payload) {
  send(res, status, JSON.stringify(payload), "application/json; charset=utf-8");
}

async function readSchedule() {
  const raw = await fsp.readFile(SEED_PATH, "utf8");
  return JSON.parse(raw);
}

async function handleApi(req, res, pathname) {
  if (pathname === "/api/offsite26/events") {
    if (req.method !== "GET") {
      sendJson(res, 405, { error: "Schedule is read-only" });
      return true;
    }

    sendJson(res, 200, await readSchedule());
    return true;
  }

  if (pathname.startsWith("/api/")) {
    sendJson(res, 404, { error: "Not found" });
    return true;
  }

  return false;
}

function resolveStaticPath(pathname) {
  // Treat trailing-slash clean URLs the same as their canonical form.
  const safePath = decodeURIComponent(pathname).replace(/^\/+|\/+$/g, "");
  const basePath = safePath ? path.join(ROOT_DIR, safePath) : path.join(ROOT_DIR, "index.html");
  const normalized = path.normalize(basePath);
  const relativePath = path.relative(ROOT_DIR, normalized);

  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    return null;
  }

  if (fs.existsSync(normalized) && fs.statSync(normalized).isFile()) {
    return normalized;
  }

  // Prefer a clean URL's sibling HTML file before a same-named directory.
  // This keeps /desktop mapped to desktop.html while /desktop/manual maps to
  // desktop/manual.html.
  if (!path.extname(normalized)) {
    const htmlPath = `${normalized}.html`;
    if (fs.existsSync(htmlPath)) {
      return htmlPath;
    }
  }

  if (fs.existsSync(normalized) && fs.statSync(normalized).isDirectory()) {
    const indexPath = path.join(normalized, "index.html");
    return fs.existsSync(indexPath) ? indexPath : null;
  }

  return null;
}

async function serveStatic(res, pathname) {
  const filePath = resolveStaticPath(pathname);
  if (!filePath) {
    send(res, 404, "Not found", "text/plain; charset=utf-8");
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const headers = {
    "Content-Type": CONTENT_TYPES[ext] || "application/octet-stream",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "SAMEORIGIN"
  };

  if ([".css", ".js", ".png", ".jpg", ".jpeg", ".webp", ".svg", ".ico"].includes(ext)) {
    headers["Cache-Control"] = "public, max-age=604800, immutable";
  }

  res.writeHead(200, headers);
  fs.createReadStream(filePath).pipe(res);
}

const server = http.createServer(async (req, res) => {
  try {
    const { pathname } = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    const handledApi = await handleApi(req, res, pathname);
    if (handledApi) return;

    if (req.method !== "GET" && req.method !== "HEAD") {
      send(res, 405, "Method not allowed", "text/plain; charset=utf-8");
      return;
    }

    await serveStatic(res, pathname);
  } catch (error) {
    sendJson(res, 500, { error: error.message || "Server error" });
  }
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`Suite server listening on http://localhost:${PORT}`);
  });
}

module.exports = { resolveStaticPath };
