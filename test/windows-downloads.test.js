const assert = require("node:assert/strict");
const test = require("node:test");

const {
  WINDOWS_MANIFEST_URL,
  architectureForPath,
  createWindowsDownloadResolver,
  parseWindowsManifest
} = require("../lib/windows-downloads");

const MANIFEST = `version: 0.1.56
files:
  - url: https://github.com/MyMeetAI/mymeet-desktop-releases/releases/download/win-v0.1.56/Mymeet.ai-0.1.56-x64-Setup.exe
  - url: https://github.com/MyMeetAI/mymeet-desktop-releases/releases/download/win-v0.1.56/Mymeet.ai-0.1.56-ia32-Setup.exe
path: https://github.com/MyMeetAI/mymeet-desktop-releases/releases/download/win-v0.1.56/Mymeet.ai-0.1.56-x64-Setup.exe
`;

test("uses the platform-scoped Windows manifest", () => {
  assert.equal(
    WINDOWS_MANIFEST_URL,
    "https://raw.githubusercontent.com/MyMeetAI/mymeet-desktop-releases/main/windows/latest.yml"
  );
  assert.doesNotMatch(WINDOWS_MANIFEST_URL, /\/releases\/latest/i);
});

test("maps both Windows architectures from the release manifest", () => {
  assert.deepEqual(parseWindowsManifest(MANIFEST), {
    version: "0.1.56",
    installers: {
      x64: "https://github.com/MyMeetAI/mymeet-desktop-releases/releases/download/win-v0.1.56/Mymeet.ai-0.1.56-x64-Setup.exe",
      ia32: "https://github.com/MyMeetAI/mymeet-desktop-releases/releases/download/win-v0.1.56/Mymeet.ai-0.1.56-ia32-Setup.exe"
    }
  });
});

test("rejects a manifest with a missing architecture mapping", () => {
  const missingIa32 = MANIFEST.replace(
    /^\s*- url: .*?-ia32-Setup\.exe\s*$/m,
    ""
  );

  assert.throws(
    () => parseWindowsManifest(missingIa32),
    /missing the ia32 installer/
  );
});

test("rejects a malformed release version", () => {
  assert.throws(
    () => parseWindowsManifest(MANIFEST.replace("version: 0.1.56", "version: latest")),
    /invalid version/
  );
});

test("rejects GitHub's cross-platform releases/latest endpoint", () => {
  const globalLatest = MANIFEST.replace(
    /releases\/download\/win-v0\.1\.56/g,
    "releases/latest/download"
  );

  assert.throws(
    () => parseWindowsManifest(globalLatest),
    /Invalid Windows x64 installer URL/
  );
});

test("rejects a release URL that does not match its version and architecture", () => {
  const wrongVersion = MANIFEST.replace(
    /win-v0\.1\.56\/Mymeet\.ai-0\.1\.56-x64-Setup\.exe/,
    "win-v0.1.57/Mymeet.ai-0.1.57-x64-Setup.exe"
  );

  assert.throws(
    () => parseWindowsManifest(wrongVersion),
    /Invalid Windows x64 installer URL/
  );
});

test("defaults the stable download route to x64", () => {
  assert.equal(architectureForPath("/downloads/windows"), "x64");
  assert.equal(architectureForPath("/downloads/windows/x64"), "x64");
  assert.equal(architectureForPath("/downloads/windows/ia32"), "ia32");
  assert.equal(architectureForPath("/downloads/windows/x64/"), "x64");
  assert.equal(architectureForPath("/downloads/windows/arm64"), null);
});

test("rejects unsupported architectures before fetching the manifest", async () => {
  let fetched = false;
  const resolver = createWindowsDownloadResolver({
    fetchImpl: async () => {
      fetched = true;
      return { ok: true, text: async () => MANIFEST };
    }
  });

  await assert.rejects(() => resolver("arm64"), /Unsupported Windows architecture/);
  assert.equal(fetched, false);
});

test("reports an upstream manifest failure when no cached release exists", async () => {
  const resolver = createWindowsDownloadResolver({
    fetchImpl: async () => ({ ok: false, status: 502 })
  });

  await assert.rejects(() => resolver("x64"), /returned HTTP 502/);
});

test("coalesces concurrent manifest refreshes", async () => {
  let attempts = 0;
  const resolver = createWindowsDownloadResolver({
    fetchImpl: async () => {
      attempts += 1;
      await new Promise((resolve) => setImmediate(resolve));
      return { ok: true, text: async () => MANIFEST };
    }
  });

  const downloads = await Promise.all([
    resolver("x64"),
    resolver("ia32"),
    resolver("x64"),
    resolver("ia32")
  ]);

  assert.equal(attempts, 1);
  assert.match(downloads[0], /-x64-Setup\.exe$/);
  assert.match(downloads[1], /-ia32-Setup\.exe$/);
});

test("keeps the last good manifest available during an upstream failure", async () => {
  let attempts = 0;
  let now = 0;
  const resolver = createWindowsDownloadResolver({
    cacheTtlMs: 10,
    now: () => now,
    fetchImpl: async () => {
      attempts += 1;
      if (attempts > 1) throw new Error("upstream unavailable");
      return { ok: true, text: async () => MANIFEST };
    }
  });

  assert.match(await resolver("x64"), /-x64-Setup\.exe$/);
  now = 11;
  assert.match(await resolver("ia32"), /-ia32-Setup\.exe$/);
  now = 15;
  assert.match(await resolver("x64"), /-x64-Setup\.exe$/);
  assert.equal(attempts, 2);
});
