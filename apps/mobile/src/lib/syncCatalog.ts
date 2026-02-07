import type { CatalogItem, Category } from "@bizu/shared";
import { fetchPublishedCategories, fetchPublishedItems } from "./catalogApi";
import { saveCatalog } from "./catalogCache";

export type SyncCatalogResult = {
  categories: Category[];
  items: CatalogItem[];
  lastSyncAt: string;
};

export async function syncCatalog(): Promise<SyncCatalogResult> {
  const [categories, items] = await Promise.all([fetchPublishedCategories(), fetchPublishedItems()]);

  await saveCatalog(categories, items);
  const lastSyncAt = new Date().toISOString();

  return {
    categories,
    items,
    lastSyncAt,
  };
}
