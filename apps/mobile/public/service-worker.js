const CACHE_VERSION = "bizu-pwa-v2";
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;
const DOWNLOADS_CACHE = "bizu-downloads-v1";
const OFFLINE_URL = "/offline.html";
const DOWNLOADS_VIRTUAL_PREFIX = "/__bizu-downloads__/";

const CORE_PRECACHE_URLS = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/favicon.ico",
  OFFLINE_URL,
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-512.png",
  "/icons/apple-touch-icon.png",
];

const MAIN_ROUTE_URLS = [
  "/search",
  "/search.html",
  "/favorites",
  "/(tabs)/favorites",
  "/(tabs)/favorites.html",
  "/suggestion",
  "/(tabs)/suggestion",
  "/(tabs)/suggestion.html",
];

self.addEventListener("install", (event) => {
  event.waitUntil(precacheAppShell());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(cleanupOldCaches());
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(request.url);
  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  if (requestUrl.pathname.startsWith(DOWNLOADS_VIRTUAL_PREFIX)) {
    event.respondWith(handleDownloadedMediaRequest(request));
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(handleNavigationRequest(request));
    return;
  }

  if (isStaticAssetPath(requestUrl.pathname) || requestUrl.pathname === "/manifest.webmanifest") {
    event.respondWith(cacheFirst(request));
  }
});

async function precacheAppShell() {
  const cache = await caches.open(STATIC_CACHE);
  const urls = uniqueUrls([...CORE_PRECACHE_URLS, ...MAIN_ROUTE_URLS]);
  const discoveredAssets = await discoverBundleAssets(urls);

  await cacheUrls(cache, uniqueUrls([...urls, ...discoveredAssets]));
  await self.skipWaiting();
}

async function cleanupOldCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(
    cacheNames
      .filter((cacheName) => !cacheName.startsWith(CACHE_VERSION))
      .map((cacheName) => caches.delete(cacheName)),
  );
  await self.clients.claim();
}

async function handleNavigationRequest(request) {
  const runtimeCache = await caches.open(RUNTIME_CACHE);

  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.ok) {
      await runtimeCache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    const fallbackResponse = await matchNavigationFallback(request);
    if (fallbackResponse) {
      return fallbackResponse;
    }

    return new Response("Offline", {
      status: 503,
      statusText: "Offline",
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.ok) {
      await cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    return cache.match(request);
  }
}

async function handleDownloadedMediaRequest(request) {
  const cache = await caches.open(DOWNLOADS_CACHE);
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  return new Response("Arquivo offline nao encontrado.", {
    status: 404,
    statusText: "Not Found",
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}

async function matchNavigationFallback(request) {
  const requestUrl = new URL(request.url);
  const candidates = uniqueUrls([
    ...toHtmlCandidates(requestUrl.pathname),
    OFFLINE_URL,
    "/index.html",
  ]);

  const runtimeCache = await caches.open(RUNTIME_CACHE);
  const staticCache = await caches.open(STATIC_CACHE);

  for (const candidate of candidates) {
    const fromRuntime = await runtimeCache.match(candidate);
    if (fromRuntime) {
      return fromRuntime;
    }

    const fromStatic = await staticCache.match(candidate);
    if (fromStatic) {
      return fromStatic;
    }
  }

  return null;
}

function toHtmlCandidates(pathname) {
  const basePath = pathname || "/";
  const candidates = [basePath];

  if (basePath === "/") {
    candidates.push("/index.html", "/(tabs)/index.html");
  } else if (basePath.endsWith("/")) {
    candidates.push(`${basePath}index.html`);
  } else if (!basePath.endsWith(".html")) {
    candidates.push(`${basePath}.html`);
  }

  if (basePath === "/favorites") {
    candidates.push("/(tabs)/favorites", "/(tabs)/favorites.html");
  }

  if (basePath === "/suggestion") {
    candidates.push("/(tabs)/suggestion", "/(tabs)/suggestion.html");
  }

  if (basePath === "/search") {
    candidates.push("/search.html");
  }

  return candidates;
}

async function discoverBundleAssets(routeUrls) {
  const discoveredAssets = new Set();
  const htmlRoutes = routeUrls.filter((routeUrl) => routeUrl === "/" || routeUrl.endsWith(".html") || !hasFileExtension(routeUrl));

  for (const routeUrl of htmlRoutes) {
    try {
      const response = await fetch(routeUrl, { cache: "no-store" });
      if (!response.ok) {
        continue;
      }

      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("text/html")) {
        continue;
      }

      const html = await response.text();
      for (const assetUrl of extractAssetUrlsFromHtml(html)) {
        discoveredAssets.add(assetUrl);
      }
    } catch {
      // Ignore failures for routes that are not available in the current hosting mode.
    }
  }

  return Array.from(discoveredAssets);
}

function extractAssetUrlsFromHtml(html) {
  const assetUrls = new Set();
  const pattern = /(href|src)=["']([^"']+)["']/gi;
  let match = pattern.exec(html);

  while (match) {
    const rawUrl = match[2];
    if (rawUrl && !rawUrl.startsWith("data:") && !rawUrl.startsWith("javascript:")) {
      try {
        const parsed = new URL(rawUrl, self.location.origin);
        if (parsed.origin === self.location.origin && isStaticAssetPath(parsed.pathname)) {
          assetUrls.add(parsed.pathname + parsed.search);
        }
      } catch {
        // Ignore malformed URLs.
      }
    }

    match = pattern.exec(html);
  }

  return assetUrls;
}

function isStaticAssetPath(pathname) {
  return (
    pathname.startsWith("/_expo/") ||
    pathname.startsWith("/assets/") ||
    pathname.startsWith("/icons/") ||
    /\.(js|css|png|jpg|jpeg|gif|svg|webp|ico|json|map|woff|woff2|ttf)$/i.test(pathname)
  );
}

async function cacheUrls(cache, urls) {
  for (const url of urls) {
    try {
      await cache.add(new Request(url, { cache: "no-store" }));
    } catch {
      // Ignore URLs that fail on install so the SW still activates.
    }
  }
}

function hasFileExtension(pathname) {
  return /\.[a-z0-9]+$/i.test(pathname);
}

function uniqueUrls(urls) {
  return Array.from(new Set(urls.filter(Boolean)));
}
