import { useEffect, useState } from "react";
import {
  createObjectUrlFromCachedDownload,
  getDownloadSizeBytes,
  isVirtualDownloadUri,
} from "./downloadStorage";

const DEFAULT_SIZE_LABEL = "-- MB";

export function useResolvedMediaUri(
  localUri: string | null | undefined,
  remoteUri: string | null | undefined,
): string | null {
  const [resolvedUri, setResolvedUri] = useState<string | null>(remoteUri ?? null);

  useEffect(() => {
    let active = true;
    let cleanup: (() => void) | null = null;

    async function resolve() {
      if (!localUri) {
        if (active) {
          setResolvedUri(remoteUri ?? null);
        }
        return;
      }

      if (!isVirtualDownloadUri(localUri)) {
        if (active) {
          setResolvedUri(localUri);
        }
        return;
      }

      const objectUrl = await createObjectUrlFromCachedDownload(localUri);
      if (!active) {
        objectUrl?.revoke();
        return;
      }

      cleanup = objectUrl?.revoke ?? null;
      setResolvedUri(objectUrl?.url ?? remoteUri ?? null);
    }

    void resolve();

    return () => {
      active = false;
      if (cleanup) {
        cleanup();
      }
    };
  }, [localUri, remoteUri]);

  return resolvedUri;
}

export async function resolveMediaUriForOpen(
  localUri: string | null | undefined,
  remoteUri: string | null | undefined,
): Promise<string | null> {
  if (!localUri) {
    return remoteUri ?? null;
  }

  if (!isVirtualDownloadUri(localUri)) {
    return localUri;
  }

  const objectUrl = await createObjectUrlFromCachedDownload(localUri);
  if (!objectUrl) {
    return remoteUri ?? null;
  }

  // Keep it available long enough for browser navigation.
  setTimeout(() => {
    objectUrl.revoke();
  }, 2 * 60 * 1000);

  return objectUrl.url;
}

export async function getCachedMediaSizeLabel(localUri: string | null | undefined): Promise<string> {
  if (!localUri || !isVirtualDownloadUri(localUri)) {
    return DEFAULT_SIZE_LABEL;
  }

  const bytes = await getDownloadSizeBytes(localUri);
  if (typeof bytes !== "number") {
    return DEFAULT_SIZE_LABEL;
  }

  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
}
