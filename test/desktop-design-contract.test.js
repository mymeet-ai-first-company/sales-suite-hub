const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const projectRoot = path.resolve(__dirname, "..");
const desktop = fs.readFileSync(path.join(projectRoot, "desktop.html"), "utf8");
const styles = fs.readFileSync(path.join(projectRoot, "styles/desktop.css"), "utf8");

test("keeps the Desktop landing on the mymeet.ai blue palette", () => {
  assert.match(styles, /--accent:\s*#0138C7/i);
  assert.doesNotMatch(
    `${desktop}\n${styles}`,
    /#B1EC52|#0D9655|rgba\(13,\s*150,\s*85|var\(--success\)|\blime\b|\bgreen\b/i
  );
});

test("loads the page stylesheet and brand asset as standalone files", () => {
  assert.match(desktop, /href="\/styles\/desktop\.css\?v=2"/);
  assert.match(desktop, /src="\/images\/mymeet-logo\.svg"/);
  assert.doesNotMatch(desktop, /<style(?:\s|>)/i);
});

test("provides tablet and mobile layouts without fixed desktop-only structure", () => {
  assert.match(styles, /@media\s*\(max-width:\s*920px\)/);
  assert.match(styles, /@media\s*\(max-width:\s*720px\)/);
  assert.match(styles, /\.download-actions,[\s\S]*grid-template-columns:\s*1fr/);
});

test("fully disables decorative motion when reduced motion is requested", () => {
  const reducedMotion = styles.match(
    /@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{([\s\S]*)\}\s*$/
  );

  assert.ok(reducedMotion);
  assert.match(reducedMotion[1], /transition:\s*none/);
  assert.match(reducedMotion[1], /animation:\s*none/);
  assert.match(reducedMotion[1], /scroll-behavior:\s*auto/);
});

test("keeps FAQ and skip navigation available without JavaScript", () => {
  assert.match(desktop, /<a class="skip-link" href="#main">/);
  assert.equal((desktop.match(/<details class="faq-item reveal">/g) || []).length, 6);
  assert.equal((desktop.match(/<summary>/g) || []).length, 6);
});
