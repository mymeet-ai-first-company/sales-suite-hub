const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");

const { resolveStaticPath } = require("../server");

const projectRoot = path.resolve(__dirname, "..");

test("serves the desktop landing before the same-named manual directory", () => {
  const landingPath = path.join(projectRoot, "desktop.html");

  assert.equal(resolveStaticPath("/desktop"), landingPath);
  assert.equal(resolveStaticPath("/desktop/"), landingPath);
});

test("serves the manual through clean URLs with or without a trailing slash", () => {
  const manualPath = path.join(projectRoot, "desktop", "manual.html");

  assert.equal(resolveStaticPath("/desktop/manual"), manualPath);
  assert.equal(resolveStaticPath("/desktop/manual/"), manualPath);
});

test("keeps root and missing-route behavior intact", () => {
  assert.equal(resolveStaticPath("/"), path.join(projectRoot, "index.html"));
  assert.equal(resolveStaticPath("/desktop/not-a-page"), null);
});

test("rejects paths that escape the static root", () => {
  assert.equal(resolveStaticPath("/%2e%2e/%2e%2e/etc/passwd"), null);
});
