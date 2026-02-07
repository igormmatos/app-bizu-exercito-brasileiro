import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import type { CatalogItem, Category } from "@bizu/shared";
import { clearCatalog, loadCatalog } from "../lib/catalogCache";
import { syncCatalog } from "../lib/syncCatalog";
import { getDownloadedMap, type DownloadedMap } from "../lib/downloadCache";
import { clearAllDownloadsMedia } from "../lib/downloadManager";
import { buildSearchIndex, type IndexedCatalogItem } from "../lib/searchIndex";
import { addFavorite, loadFavorites, removeFavorite } from "../lib/favoritesCache";
import { clearBizuOfTheDayCache, loadBizuOfTheDay } from "../lib/bizuOfTheDay";

type CatalogContextValue = {
  categories: Category[];
  items: CatalogItem[];
  searchIndex: IndexedCatalogItem[];
  favoriteIds: string[];
  favoriteCount: number;
  bizuOfTheDay: CatalogItem | null;
  lastSyncAt: string | null;
  downloadedMap: DownloadedMap;
  downloadedCount: number;
  loadingCache: boolean;
  loadingDownloads: boolean;
  loadingFavorites: boolean;
  loadingBizu: boolean;
  syncing: boolean;
  message: string | null;
  reloadCache: () => Promise<void>;
  reloadDownloads: () => Promise<void>;
  reloadFavorites: () => Promise<void>;
  reloadBizuOfTheDay: () => Promise<void>;
  recalculateBizuOfTheDay: () => Promise<void>;
  isFavorite: (id: string) => boolean;
  toggleFavorite: (id: string) => Promise<void>;
  syncNow: () => Promise<void>;
  clearNow: () => Promise<void>;
  clearDownloadsNow: () => Promise<void>;
};

const CatalogContext = createContext<CatalogContextValue | null>(null);

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [bizuOfTheDay, setBizuOfTheDay] = useState<CatalogItem | null>(null);
  const [downloadedMap, setDownloadedMap] = useState<DownloadedMap>({});
  const [loadingCache, setLoadingCache] = useState(true);
  const [loadingDownloads, setLoadingDownloads] = useState(true);
  const [loadingFavorites, setLoadingFavorites] = useState(true);
  const [loadingBizu, setLoadingBizu] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const searchIndex = useMemo(() => buildSearchIndex(items), [items]);

  useEffect(() => {
    async function bootstrap() {
      await Promise.all([reloadCache(), reloadDownloads(), reloadFavorites()]);
      try {
        await syncNow();
      } catch {
        // Keep cache data when startup sync fails.
      }
    }

    void bootstrap();
  }, []);

  async function syncBizuOfTheDay(itemsSource: CatalogItem[]) {
    setLoadingBizu(true);
    try {
      const picked = await loadBizuOfTheDay(itemsSource);
      setBizuOfTheDay(picked);
    } catch {
      setBizuOfTheDay(null);
    } finally {
      setLoadingBizu(false);
    }
  }

  async function reloadCache() {
    setLoadingCache(true);
    try {
      const data = await loadCatalog();
      setCategories(data.categories);
      setItems(data.items);
      setLastSyncAt(data.lastSyncAt);
      await syncBizuOfTheDay(data.items);
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

  async function reloadFavorites() {
    setLoadingFavorites(true);
    try {
      const ids = await loadFavorites();
      setFavoriteIds(ids);
    } catch (error) {
      setMessage(toMessage(error, "Falha ao carregar favoritos locais."));
    } finally {
      setLoadingFavorites(false);
    }
  }

  async function reloadBizuOfTheDay() {
    await syncBizuOfTheDay(items);
  }

  async function recalculateBizuOfTheDay() {
    await clearBizuOfTheDayCache();
    await syncBizuOfTheDay(items);
  }

  function isFavorite(id: string): boolean {
    return favoriteIds.includes(id);
  }

  async function toggleFavorite(id: string) {
    if (!id) {
      return;
    }

    try {
      if (isFavorite(id)) {
        await removeFavorite(id);
      } else {
        await addFavorite(id);
      }

      const refreshedIds = await loadFavorites();
      setFavoriteIds(refreshedIds);
    } catch (error) {
      setMessage(toMessage(error, "Falha ao atualizar favorito."));
      throw error;
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
      await syncBizuOfTheDay(result.items);
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
      setBizuOfTheDay(null);
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
      favoriteIds,
      favoriteCount: favoriteIds.length,
      bizuOfTheDay,
      lastSyncAt,
      downloadedMap,
      downloadedCount: Object.keys(downloadedMap).length,
      loadingCache,
      loadingDownloads,
      loadingFavorites,
      loadingBizu,
      syncing,
      message,
      reloadCache,
      reloadDownloads,
      reloadFavorites,
      reloadBizuOfTheDay,
      recalculateBizuOfTheDay,
      isFavorite,
      toggleFavorite,
      syncNow,
      clearNow,
      clearDownloadsNow,
    }),
    [
      categories,
      items,
      searchIndex,
      favoriteIds,
      bizuOfTheDay,
      lastSyncAt,
      downloadedMap,
      loadingCache,
      loadingDownloads,
      loadingFavorites,
      loadingBizu,
      syncing,
      message,
    ],
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
