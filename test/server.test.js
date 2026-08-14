const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");

const { createSuiteServer, resolveStaticPath } = require("../server");

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

test("redirects stable Windows routes to the requested architecture", async (t) => {
  const requestedArchitectures = [];
  const server = createSuiteServer({
    resolveWindowsDownload: async (architecture) => {
      requestedArchitectures.push(architecture);
      return `https://downloads.example/Mymeet.ai-${architecture}-Setup.exe`;
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => server.close());

  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  for (const [pathname, architecture] of [
    ["/downloads/windows", "x64"],
    ["/downloads/windows/x64", "x64"],
    ["/downloads/windows/x64/", "x64"],
    ["/downloads/windows/ia32", "ia32"]
  ]) {
    const response = await fetch(`${baseUrl}${pathname}`, {
      method: pathname.endsWith("/") ? "HEAD" : "GET",
      redirect: "manual"
    });
    assert.equal(response.status, 302);
    assert.equal(
      response.headers.get("location"),
      `https://downloads.example/Mymeet.ai-${architecture}-Setup.exe`
    );
    assert.equal(response.headers.get("cache-control"), "no-store");
  }

  assert.deepEqual(requestedArchitectures, ["x64", "x64", "x64", "ia32"]);
});

test("does not redirect non-GET Windows download requests", async (t) => {
  const server = createSuiteServer({
    resolveWindowsDownload: async () => {
      throw new Error("resolver should not be called");
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => server.close());

  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/downloads/windows`, {
    method: "POST"
  });

  assert.equal(response.status, 405);
  assert.equal(response.headers.get("location"), null);
});

test("returns a retriable error when the Windows manifest cannot be resolved", async (t) => {
  const server = createSuiteServer({
    resolveWindowsDownload: async () => {
      throw new Error("manifest unavailable");
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => server.close());

  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/downloads/windows/x64`);

  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { error: "manifest unavailable" });
});
