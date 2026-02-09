import type { CatalogItem } from "@bizu/shared";
import { downloadItemMedia, removeItemMedia, type DownloadableMediaType } from "./downloadManager";

export type BatchMode = "download" | "remove";

export type BatchProgress = {
  mode: BatchMode;
  completed: number;
  total: number;
  currentItemTitle: string | null;
  okCount: number;
  failCount: number;
};

export type BatchController = {
  cancel: () => void;
  isCancelled: () => boolean;
};

type DownloadableItem = CatalogItem & {
  type: DownloadableMediaType;
  storage_path: string;
};

class BatchCancelledError extends Error {
  constructor() {
    super("Operação em lote cancelada.");
    this.name = "BatchCancelledError";
  }
}

export function createBatchController(): BatchController {
  let cancelled = false;
  return {
    cancel: () => {
      cancelled = true;
    },
    isCancelled: () => cancelled,
  };
}

export function isBatchCancelledError(error: unknown): boolean {
  return error instanceof BatchCancelledError;
}

export function getCategoryMediaItems(items: CatalogItem[]): DownloadableItem[] {
  return items.filter(isDownloadableItem);
}

export async function downloadCategory(
  items: CatalogItem[],
  onProgress?: (progress: BatchProgress) => void,
  controller?: BatchController,
): Promise<{ okCount: number; failCount: number }> {
  const eligible = getCategoryMediaItems(items);
  const total = eligible.length;
  let okCount = 0;
  let failCount = 0;

  onProgress?.({
    mode: "download",
    completed: 0,
    total,
    currentItemTitle: null,
    okCount,
    failCount,
  });

  for (let index = 0; index < total; index += 1) {
    if (controller?.isCancelled()) {
      throw new BatchCancelledError();
    }

    const item = eligible[index];
    onProgress?.({
      mode: "download",
      completed: index,
      total,
      currentItemTitle: item.title,
      okCount,
      failCount,
    });

    try {
      await downloadItemMedia(item.id, item.storage_path, item.type);
      okCount += 1;
    } catch {
      failCount += 1;
    }

    onProgress?.({
      mode: "download",
      completed: index + 1,
      total,
      currentItemTitle: item.title,
      okCount,
      failCount,
    });
  }

  onProgress?.({
    mode: "download",
    completed: total,
    total,
    currentItemTitle: null,
    okCount,
    failCount,
  });

  return { okCount, failCount };
}

export async function removeCategoryDownloads(
  items: CatalogItem[],
  onProgress?: (progress: BatchProgress) => void,
  controller?: BatchController,
): Promise<void> {
  const eligible = getCategoryMediaItems(items);
  const total = eligible.length;
  let okCount = 0;
  let failCount = 0;

  onProgress?.({
    mode: "remove",
    completed: 0,
    total,
    currentItemTitle: null,
    okCount,
    failCount,
  });

  for (let index = 0; index < total; index += 1) {
    if (controller?.isCancelled()) {
      throw new BatchCancelledError();
    }

    const item = eligible[index];
    onProgress?.({
      mode: "remove",
      completed: index,
      total,
      currentItemTitle: item.title,
      okCount,
      failCount,
    });

    try {
      await removeItemMedia(item.id);
      okCount += 1;
    } catch {
      failCount += 1;
    }

    onProgress?.({
      mode: "remove",
      completed: index + 1,
      total,
      currentItemTitle: item.title,
      okCount,
      failCount,
    });
  }

  onProgress?.({
    mode: "remove",
    completed: total,
    total,
    currentItemTitle: null,
    okCount,
    failCount,
  });

  if (failCount > 0) {
    throw new Error(`Falha ao remover ${failCount} item(ns) da categoria.`);
  }
}

function isDownloadableItem(item: CatalogItem): item is DownloadableItem {
  if (!item.storage_path) {
    return false;
  }

  return item.type === "pdf" || item.type === "audio" || item.type === "image";
}
