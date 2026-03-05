export const DOWNLOADS_CACHE_NAME = "bizu-downloads-v1";
export const DOWNLOADS_VIRTUAL_PREFIX = "/__bizu-downloads__/";

type CachedObjectUrl = {
  url: string;
  revoke: () => void;
};

export function normalizeVirtualUri(uri: string): string {
  if (!uri) {
    return "";
  }

  if (/^https?:\/\//i.test(uri)) {
    try {
      const parsed = new URL(uri);
      return `${parsed.pathname}${parsed.search}`;
    } catch {
      return "";
    }
  }

  if (uri.startsWith("/")) {
    return uri;
  }

  return `/${uri}`;
}

export function isVirtualDownloadUri(uri: string): boolean {
  return normalizeVirtualUri(uri).startsWith(DOWNLOADS_VIRTUAL_PREFIX);
}

export function createVirtualDownloadUri(itemId: string, extension: string): string {
  const safeItemId = encodeURIComponent(itemId.trim());
  const safeExtension = sanitizeExtension(extension);
  return `${DOWNLOADS_VIRTUAL_PREFIX}${safeItemId}.${safeExtension}`;
}

export async function putDownloadResponse(localUri: string, response: Response): Promise<void> {
  const cache = await openDownloadsCache();
  if (!cache) {
    throw new Error("Cache API indisponível neste navegador.");
  }
  await cache.put(createCacheRequest(localUri), response.clone());
}

export async function matchDownloadResponse(localUri: string): Promise<Response | null> {
  const cache = await openDownloadsCache();
  if (!cache) {
    return null;
  }
  const response = await cache.match(createCacheRequest(localUri));
  return response ?? null;
}

export async function deleteDownloadResponse(localUri: string): Promise<boolean> {
  const cache = await openDownloadsCache();
  if (!cache) {
    return false;
  }
  return cache.delete(createCacheRequest(localUri));
}

export async function hasDownloadResponse(localUri: string): Promise<boolean> {
  const response = await matchDownloadResponse(localUri);
  return Boolean(response);
}

export async function clearDownloadsCache(): Promise<void> {
  if (typeof caches === "undefined") {
    return;
  }
  await caches.delete(DOWNLOADS_CACHE_NAME);
}

export async function getDownloadSizeBytes(localUri: string): Promise<number | null> {
  const response = await matchDownloadResponse(localUri);
  if (!response) {
    return null;
  }

  const blob = await response.clone().blob();
  return blob.size;
}

export async function createObjectUrlFromCachedDownload(localUri: string): Promise<CachedObjectUrl | null> {
  if (typeof URL === "undefined" || typeof URL.createObjectURL !== "function") {
    return null;
  }

  const response = await matchDownloadResponse(localUri);
  if (!response) {
    return null;
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  return {
    url,
    revoke: () => {
      URL.revokeObjectURL(url);
    },
  };
}

function sanitizeExtension(extension: string): string {
  const normalized = extension.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!normalized) {
    return "bin";
  }
  return normalized;
}

function createCacheRequest(localUri: string): Request {
  const normalizedUri = normalizeVirtualUri(localUri);
  if (!normalizedUri) {
    throw new Error("URI virtual de download inválida.");
  }

  if (typeof window !== "undefined" && window.location?.origin) {
    return new Request(`${window.location.origin}${normalizedUri}`);
  }

  return new Request(`https://bizu.local${normalizedUri}`);
}

async function openDownloadsCache(): Promise<Cache | null> {
  if (typeof caches === "undefined") {
    return null;
  }
  return caches.open(DOWNLOADS_CACHE_NAME);
}
