const WINDOWS_MANIFEST_URL =
  "https://raw.githubusercontent.com/MyMeetAI/mymeet-desktop-releases/main/windows/latest.yml";
const WINDOWS_DOWNLOAD_PATHS = new Set([
  "/downloads/windows",
  "/downloads/windows/x64",
  "/downloads/windows/ia32"
]);
const SUPPORTED_ARCHITECTURES = new Set(["x64", "ia32"]);
const DEFAULT_CACHE_TTL_MS = 5 * 60 * 1000;

function validateInstallerUrl(rawUrl, version, architecture) {
  const installerUrl = new URL(rawUrl);
  const expectedTag = `/releases/download/win-v${version}/`;
  const expectedFile = `Mymeet.ai-${version}-${architecture}-Setup.exe`;

  if (
    installerUrl.protocol !== "https:" ||
    installerUrl.hostname !== "github.com" ||
    !installerUrl.pathname.toLowerCase().startsWith(
      "/mymeetai/mymeet-desktop-releases/"
    ) ||
    !installerUrl.pathname.includes(expectedTag) ||
    !installerUrl.pathname.endsWith(`/${expectedFile}`) ||
    installerUrl.pathname.includes("/releases/latest")
  ) {
    throw new Error(`Invalid Windows ${architecture} installer URL in release manifest`);
  }

  return installerUrl.href;
}

function parseWindowsManifest(manifest) {
  const versionMatch = manifest.match(/^version:\s*([^\s]+)\s*$/m);
  if (!versionMatch) {
    throw new Error("Windows release manifest is missing a version");
  }

  const version = versionMatch[1];
  if (!/^\d+\.\d+\.\d+$/.test(version)) {
    throw new Error("Windows release manifest has an invalid version");
  }

  const urls = [...manifest.matchAll(/^\s*-?\s*url:\s*(https:\/\/\S+)\s*$/gm)].map(
    (match) => match[1]
  );
  const installers = {};

  for (const architecture of SUPPORTED_ARCHITECTURES) {
    const marker = `-${architecture}-Setup.exe`;
    const rawUrl = urls.find((url) => url.endsWith(marker));
    if (!rawUrl) {
      throw new Error(`Windows release manifest is missing the ${architecture} installer`);
    }

    installers[architecture] = validateInstallerUrl(rawUrl, version, architecture);
  }

  return { version, installers };
}

function architectureForPath(pathname) {
  const normalizedPath = pathname.replace(/\/+$/, "") || "/";
  if (!WINDOWS_DOWNLOAD_PATHS.has(normalizedPath)) return null;
  return normalizedPath === "/downloads/windows/ia32" ? "ia32" : "x64";
}

function createWindowsDownloadResolver({
  fetchImpl = globalThis.fetch,
  manifestUrl = WINDOWS_MANIFEST_URL,
  cacheTtlMs = DEFAULT_CACHE_TTL_MS,
  now = Date.now
} = {}) {
  let cachedRelease = null;
  let cacheExpiresAt = 0;
  let refreshPromise = null;

  return async function resolveWindowsDownload(architecture) {
    if (!SUPPORTED_ARCHITECTURES.has(architecture)) {
      throw new Error(`Unsupported Windows architecture: ${architecture}`);
    }

    if (cachedRelease && now() < cacheExpiresAt) {
      return cachedRelease.installers[architecture];
    }

    try {
      if (!refreshPromise) {
        refreshPromise = (async () => {
          const response = await fetchImpl(manifestUrl, {
            headers: { Accept: "text/yaml, text/plain" },
            signal: AbortSignal.timeout(5000)
          });
          if (!response.ok) {
            throw new Error(`Windows release manifest returned HTTP ${response.status}`);
          }

          return parseWindowsManifest(await response.text());
        })().finally(() => {
          refreshPromise = null;
        });
      }

      cachedRelease = await refreshPromise;
      cacheExpiresAt = now() + cacheTtlMs;
    } catch (error) {
      if (!cachedRelease) throw error;
      cacheExpiresAt = now() + cacheTtlMs;
    }

    return cachedRelease.installers[architecture];
  };
}

module.exports = {
  WINDOWS_MANIFEST_URL,
  architectureForPath,
  createWindowsDownloadResolver,
  parseWindowsManifest
};
