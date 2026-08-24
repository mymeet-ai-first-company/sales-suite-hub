const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const projectRoot = path.resolve(__dirname, "..");
const desktop = fs.readFileSync(path.join(projectRoot, "desktop.html"), "utf8");
const suite = fs.readFileSync(path.join(projectRoot, "index.html"), "utf8");
const downloadImplementation = [
  desktop,
  suite,
  fs.readFileSync(path.join(projectRoot, "server.js"), "utf8")
].join("\n");

test("removes stale Windows launch placeholders and installer copy", () => {
  for (const placeholder of [
    /через пару недель/i,
    /Windows[^<.]*скоро/i,
    /готовится к публичному тест/i,
    /появится[^<.]*недел/i,
    /полный релиз[^<.]*август/i,
    /Mymeet\.ai\.Setup\.0\.1\.40\.exe/i
  ]) {
    assert.doesNotMatch(desktop, placeholder);
  }
});

test("uses stable Windows download routes everywhere the installer is offered", () => {
  assert.equal((desktop.match(/href="\/downloads\/windows"/g) || []).length, 1);
  assert.equal((desktop.match(/href="\/downloads\/windows\/x64"/g) || []).length, 2);
  assert.equal((desktop.match(/href="\/downloads\/windows\/ia32"/g) || []).length, 2);
  assert.doesNotMatch(
    desktop,
    /href="https:\/\/github\.com\/MyMeetAI\/mymeet-desktop-releases\/releases\/download\/win-v/i
  );
});

test("never uses GitHub's cross-platform releases/latest shortcut", () => {
  assert.doesNotMatch(downloadImplementation, /\/releases\/latest/i);
});

test("uses the current stable macOS download paths everywhere", () => {
  assert.equal(
    (desktop.match(/mac-v0\.1\.58\/Mymeet\.ai-0\.1\.58-arm64\.dmg/g) || []).length,
    2
  );
  assert.equal(
    (desktop.match(/mac-v0\.1\.58\/Mymeet\.ai-0\.1\.58\.dmg/g) || []).length,
    2
  );
  assert.doesNotMatch(desktop, /mac-v0\.1\.56|Mymeet\.ai-0\.1\.56|macOS v0\.1\.56/);
});

test("does not advertise the retired Windows 0.1.40 release on the Suite card", () => {
  assert.doesNotMatch(suite, /Windows v0\.1\.40/i);
  assert.match(suite, /macOS и Windows 10\/11/);
});
