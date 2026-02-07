import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import type { CatalogItem, Category } from "@bizu/shared";
import { clearCatalog, loadCatalog } from "../lib/catalogCache";
import { syncCatalog } from "../lib/syncCatalog";
import { getDownloadedMap, type DownloadedMap } from "../lib/downloadCache";
import { clearAllDownloadsMedia } from "../lib/downloadManager";
import { buildSearchIndex, type IndexedCatalogItem } from "../lib/searchIndex";

type CatalogContextValue = {
  categories: Category[];
  items: CatalogItem[];
  searchIndex: IndexedCatalogItem[];
  lastSyncAt: string | null;
  downloadedMap: DownloadedMap;
  downloadedCount: number;
  loadingCache: boolean;
  loadingDownloads: boolean;
  syncing: boolean;
  message: string | null;
  reloadCache: () => Promise<void>;
  reloadDownloads: () => Promise<void>;
  syncNow: () => Promise<void>;
  clearNow: () => Promise<void>;
  clearDownloadsNow: () => Promise<void>;
};

const CatalogContext = createContext<CatalogContextValue | null>(null);

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [downloadedMap, setDownloadedMap] = useState<DownloadedMap>({});
  const [loadingCache, setLoadingCache] = useState(true);
  const [loadingDownloads, setLoadingDownloads] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const searchIndex = useMemo(() => buildSearchIndex(items), [items]);

  useEffect(() => {
    void reloadCache();
    void reloadDownloads();
  }, []);

  async function reloadCache() {
    setLoadingCache(true);
    try {
      const data = await loadCatalog();
      setCategories(data.categories);
      setItems(data.items);
      setLastSyncAt(data.lastSyncAt);
      setMessage(null);
    } catch (error) {
      setMessage(toMessage(error, "Falha ao carregar cache local."));
    } finally {
      setLoadingCache(false);
    }
  }

  async function reloadDownloads() {
    setLoadingDownloads(true);
    try {
      const map = await getDownloadedMap();
      setDownloadedMap(map);
    } catch (error) {
      setMessage(toMessage(error, "Falha ao carregar status de downloads."));
    } finally {
      setLoadingDownloads(false);
    }
  }

  async function syncNow() {
    setSyncing(true);
    setMessage(null);
    try {
      const result = await syncCatalog();
      setCategories(result.categories);
      setItems(result.items);
      setLastSyncAt(result.lastSyncAt);
      setMessage(
        `Sincronizacao concluida: ${result.categories.length} categorias e ${result.items.length} itens.`,
      );
    } catch (error) {
      setMessage(toMessage(error, "Falha no sync do catalogo."));
      throw error;
    } finally {
      setSyncing(false);
    }
  }

  async function clearNow() {
    try {
      await clearCatalog();
      setCategories([]);
      setItems([]);
      setLastSyncAt(null);
      setMessage("Cache local removido.");
    } catch (error) {
      setMessage(toMessage(error, "Falha ao limpar cache local."));
      throw error;
    }
  }

  async function clearDownloadsNow() {
    try {
      await clearAllDownloadsMedia();
      setDownloadedMap({});
      setMessage("Downloads locais removidos.");
    } catch (error) {
      setMessage(toMessage(error, "Falha ao limpar downloads locais."));
      throw error;
    }
  }

  const value = useMemo<CatalogContextValue>(
    () => ({
      categories,
      items,
      searchIndex,
      lastSyncAt,
      downloadedMap,
      downloadedCount: Object.keys(downloadedMap).length,
      loadingCache,
      loadingDownloads,
      syncing,
      message,
      reloadCache,
      reloadDownloads,
      syncNow,
      clearNow,
      clearDownloadsNow,
    }),
    [categories, items, searchIndex, lastSyncAt, downloadedMap, loadingCache, loadingDownloads, syncing, message],
  );

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  const value = useContext(CatalogContext);
  if (!value) {
    throw new Error("useCatalog must be used inside CatalogProvider");
  }
  return value;
}

function toMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    return `${fallback} ${error.message}`;
  }
  return fallback;
}
