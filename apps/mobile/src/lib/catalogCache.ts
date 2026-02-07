import AsyncStorage from "@react-native-async-storage/async-storage";
import { parseCatalogItems, parseCategory } from "@bizu/shared";
import type { CatalogItem, Category } from "@bizu/shared";

const KEYS = {
  categories: "catalog.categories",
  items: "catalog.items",
  lastSyncAt: "catalog.lastSyncAt",
} as const;

export async function loadCatalog(): Promise<{
  categories: Category[];
  items: CatalogItem[];
  lastSyncAt: string | null;
}> {
  const [categoriesRaw, itemsRaw, lastSyncAtRaw] = await Promise.all([
    AsyncStorage.getItem(KEYS.categories),
    AsyncStorage.getItem(KEYS.items),
    AsyncStorage.getItem(KEYS.lastSyncAt),
  ]);

  const categories = categoriesRaw ? (JSON.parse(categoriesRaw) as unknown[]).map(parseCategory) : [];
  const items = itemsRaw ? parseCatalogItems(JSON.parse(itemsRaw)) : [];
  const lastSyncAt = lastSyncAtRaw ?? null;

  return { categories, items, lastSyncAt };
}

export async function saveCatalog(categories: Category[], items: CatalogItem[]): Promise<void> {
  const lastSyncAt = new Date().toISOString();

  await Promise.all([
    AsyncStorage.setItem(KEYS.categories, JSON.stringify(categories)),
    AsyncStorage.setItem(KEYS.items, JSON.stringify(items)),
    AsyncStorage.setItem(KEYS.lastSyncAt, lastSyncAt),
  ]);
}

export async function clearCatalog(): Promise<void> {
  await Promise.all([
    AsyncStorage.removeItem(KEYS.categories),
    AsyncStorage.removeItem(KEYS.items),
    AsyncStorage.removeItem(KEYS.lastSyncAt),
  ]);
}
