import * as FileSystem from "expo-file-system/legacy";
import { getPublicContentUrl } from "./catalogApi";
import {
  clearDownloads,
  getDownloadedMap,
  removeDownloaded,
  setDownloaded,
  type DownloadedEntry,
} from "./downloadCache";

export type DownloadableMediaType = "pdf" | "audio" | "image";

const DOWNLOADS_ROOT = `${FileSystem.documentDirectory ?? ""}downloads/`;

export async function downloadItemMedia(
  itemId: string,
  storagePath: string,
  type: DownloadableMediaType,
): Promise<{ localUri: string }> {
  await ensureDir(DOWNLOADS_ROOT);

  const typeDir = `${DOWNLOADS_ROOT}${type}/`;
  await ensureDir(typeDir);

  const extension = resolveExtension(storagePath, type);
  const localUri = `${typeDir}${itemId}.${extension}`;
  const remoteUrl = getPublicContentUrl(storagePath);

  const result = await FileSystem.downloadAsync(remoteUrl, localUri);
  if (!result?.uri) {
    throw new Error("Download failed: no local file URI returned.");
  }

  await setDownloaded(itemId, {
    localUri: result.uri,
    storagePath,
    downloadedAt: new Date().toISOString(),
  });

  return { localUri: result.uri };
}

export async function removeItemMedia(itemId: string): Promise<void> {
  const map = await getDownloadedMap();
  const entry = map[itemId];

  if (entry?.localUri) {
    await FileSystem.deleteAsync(entry.localUri, { idempotent: true });
  }

  await removeDownloaded(itemId);
}

export async function isItemDownloaded(itemId: string): Promise<boolean> {
  const map = await getDownloadedMap();
  return Boolean(map[itemId]);
}

export async function getDownloadedEntry(itemId: string): Promise<DownloadedEntry | null> {
  const map = await getDownloadedMap();
  return map[itemId] ?? null;
}

export async function clearAllDownloadsMedia(): Promise<void> {
  await FileSystem.deleteAsync(DOWNLOADS_ROOT, { idempotent: true });
  await clearDownloads();
}

async function ensureDir(path: string): Promise<void> {
  await FileSystem.makeDirectoryAsync(path, { intermediates: true });
}

function resolveExtension(storagePath: string, type: DownloadableMediaType): string {
  const cleanPath = storagePath.split("?")[0];
  const fileName = cleanPath.split("/").pop() ?? "";
  const byPath = fileName.includes(".") ? fileName.split(".").pop()?.trim().toLowerCase() : "";

  if (byPath) {
    return byPath;
  }

  if (type === "pdf") return "pdf";
  if (type === "audio") return "mp3";
  return "jpg";
}
