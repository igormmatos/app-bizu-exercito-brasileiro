import AsyncStorage from "@react-native-async-storage/async-storage";
import { hasDownloadResponse } from "./downloadStorage";

export type DownloadedEntry = {
  localUri: string;
  storagePath: string;
  downloadedAt: string;
};

export type DownloadedMap = Record<string, DownloadedEntry>;

const DOWNLOADS_MAP_KEY = "downloads.map";

export async function getDownloadedMap(): Promise<DownloadedMap> {
  const raw = await AsyncStorage.getItem(DOWNLOADS_MAP_KEY);
  if (!raw) {
    return {};
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    await AsyncStorage.removeItem(DOWNLOADS_MAP_KEY);
    return {};
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    await AsyncStorage.removeItem(DOWNLOADS_MAP_KEY);
    return {};
  }

  const map = parsed as Record<string, unknown>;
  const sanitized: DownloadedMap = {};

  for (const [itemId, value] of Object.entries(map)) {
    if (!value || typeof value !== "object") {
      continue;
    }

    const entry = value as Partial<DownloadedEntry>;
    if (!entry.localUri || !entry.storagePath || !entry.downloadedAt) {
      continue;
    }

    const existsInCache = await hasDownloadResponse(entry.localUri);
    if (!existsInCache) {
      continue;
    }

    sanitized[itemId] = {
      localUri: entry.localUri,
      storagePath: entry.storagePath,
      downloadedAt: entry.downloadedAt,
    };
  }

  if (Object.keys(sanitized).length !== Object.keys(map).length) {
    await AsyncStorage.setItem(DOWNLOADS_MAP_KEY, JSON.stringify(sanitized));
  }

  return sanitized;
}

export async function setDownloaded(itemId: string, entry: DownloadedEntry): Promise<void> {
  const map = await getDownloadedMap();
  map[itemId] = entry;
  await AsyncStorage.setItem(DOWNLOADS_MAP_KEY, JSON.stringify(map));
}

export async function removeDownloaded(itemId: string): Promise<void> {
  const map = await getDownloadedMap();
  if (map[itemId]) {
    delete map[itemId];
    await AsyncStorage.setItem(DOWNLOADS_MAP_KEY, JSON.stringify(map));
  }
}

export async function clearDownloads(): Promise<void> {
  await AsyncStorage.removeItem(DOWNLOADS_MAP_KEY);
}
