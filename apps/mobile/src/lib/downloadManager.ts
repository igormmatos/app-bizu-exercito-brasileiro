import { getPublicContentUrl } from "./catalogApi";
import {
  clearDownloads,
  getDownloadedMap,
  removeDownloaded,
  setDownloaded,
  type DownloadedEntry,
} from "./downloadCache";
import { clearDownloadsCache, createVirtualDownloadUri, deleteDownloadResponse, putDownloadResponse } from "./downloadStorage";

export type DownloadableMediaType = "pdf" | "audio" | "image";

export async function downloadItemMedia(
  itemId: string,
  storagePath: string,
  type: DownloadableMediaType,
): Promise<{ localUri: string }> {
  const extension = resolveExtension(storagePath, type);
  const localUri = createVirtualDownloadUri(itemId, extension);
  const remoteUrl = getPublicContentUrl(storagePath);

  const response = await fetch(remoteUrl);
  if (!response.ok) {
    throw new Error(`Falha no download remoto (${response.status}).`);
  }

  await putDownloadResponse(localUri, response.clone());

  await setDownloaded(itemId, {
    localUri,
    storagePath,
    downloadedAt: new Date().toISOString(),
  });

  return { localUri };
}

export async function removeItemMedia(itemId: string): Promise<void> {
  const map = await getDownloadedMap();
  const entry = map[itemId];

  if (entry?.localUri) {
    await deleteDownloadResponse(entry.localUri);
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
  await clearDownloadsCache();
  await clearDownloads();
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
