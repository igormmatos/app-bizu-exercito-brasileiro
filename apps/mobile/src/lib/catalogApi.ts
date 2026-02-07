import { parseCatalogItem, parseCatalogItems, parseCategory } from "@bizu/shared";
import type { CatalogItem, Category } from "@bizu/shared";
import { supabase } from "./supabaseClient";

export async function fetchPublishedCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("published", true)
    .order("sort_order", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch categories: ${error.message}`);
  }

  return (data ?? []).map((row) => parseCategory(row));
}

export async function fetchPublishedItems(): Promise<CatalogItem[]> {
  // Ordering choice: most recently updated first.
  const { data, error } = await supabase
    .from("items")
    .select("*")
    .eq("published", true)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch items: ${error.message}`);
  }

  return parseCatalogItems(data ?? []);
}

export function getPublicContentUrl(storagePath: string): string {
  const base = process.env.EXPO_PUBLIC_SUPABASE_URL;
  if (!base) {
    throw new Error("Missing EXPO_PUBLIC_SUPABASE_URL for storage public URL.");
  }

  const normalizedBase = base.replace(/\/+$/, "");
  const normalizedPath = storagePath.replace(/^\/+/, "");
  return `${normalizedBase}/storage/v1/object/public/content/${normalizedPath}`;
}

export function parseItemUnsafe(input: unknown): CatalogItem {
  return parseCatalogItem(input);
}
