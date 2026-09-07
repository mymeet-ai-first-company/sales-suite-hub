const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const projectRoot = path.resolve(__dirname, "..");
const page = fs.readFileSync(path.join(projectRoot, "index.html"), "utf8");
const styles = fs.readFileSync(path.join(projectRoot, "styles/suite.css"), "utf8");

test("uses the standalone Suite design assets", () => {
  assert.match(page, /href="\/styles\/suite\.css\?v=1"/);
  assert.match(page, /src="\/scripts\/suite\.js"/);
  assert.match(page, /src="\/images\/mymeet-logo\.svg"/);
  assert.doesNotMatch(page, /<style(?:\s|>)/i);
});

test("keeps the Suite landing in the mymeet.ai blue system", () => {
  assert.match(styles, /--accent:\s*#0138C7/i);
  assert.doesNotMatch(
    `${page}\n${styles}`,
    /#B1EC52|#0D9655|rgba\(13,\s*150,\s*85|var\(--success\)|\blime\b|\bgreen\b/i
  );
});

test("presents the three product entry points and one connected workflow", () => {
  assert.match(page, /id="products"/);
  assert.match(page, />mymeet\.ai</);
  assert.match(page, />Sales Prep</);
  assert.match(page, />Desktop</);
  assert.equal((page.match(/class="map-node/g) || []).length, 3);
  assert.equal((page.match(/<li><span>0[1-3]<\/span>/g) || []).length, 3);
});

test("routes every product CTA to its intended destination", () => {
  assert.match(page, /href="https:\/\/mymeet\.ai"/);
  assert.match(page, /href="https:\/\/prep\.mymeet\.ai"/);
  assert.match(page, /href="\/desktop"/);
  assert.doesNotMatch(page, /href="#"/);
});

test("supports compact layouts and accessibility preferences", () => {
  assert.match(styles, /@media\s*\(max-width:\s*980px\)/);
  assert.match(styles, /@media\s*\(max-width:\s*720px\)/);
  assert.match(styles, /@media\s*\(prefers-reduced-transparency:\s*reduce\)/);
  assert.match(styles, /@media\s*\(prefers-contrast:\s*more\)/);
  assert.match(styles, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  assert.match(page, /<a class="skip-link" href="#main">/);
});

test("avoids the former photographic landing treatment", () => {
  assert.doesNotMatch(page, /landscape|background-image|unsplash/i);
  assert.doesNotMatch(styles, /linear-gradient|radial-gradient/i);
});
