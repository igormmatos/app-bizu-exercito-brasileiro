import { parseCatalogItem, parseCategory } from "@bizu/shared";
import type { CatalogItem, Category, ItemType } from "@bizu/shared";
import { supabase } from "./supabaseClient";

export type ItemPublishedFilter = "all" | "published" | "draft";

export type CategoryInput = {
  id?: string;
  name: string;
  sortOrder: number;
  published: boolean;
};

export type ItemInput = {
  id?: string;
  title: string;
  description?: string;
  type: ItemType;
  categoryId: string;
  tagsInput?: string;
  published: boolean;
  textBody?: string;
  existingStoragePath?: string | null;
  file?: File | null;
};

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    throw new Error(`Failed to load categories: ${error.message}`);
  }

  return (data ?? []).map((row) => parseCategory(row));
}

export async function saveCategory(input: CategoryInput): Promise<Category> {
  const id = input.id ?? crypto.randomUUID();
  const now = new Date().toISOString();

  const parsed = parseCategory({
    id,
    name: input.name,
    sort_order: input.sortOrder,
    published: input.published,
    updated_at: now,
  });

  const { data, error } = await supabase
    .from("categories")
    .upsert(parsed, { onConflict: "id" })
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to save category: ${error.message}`);
  }

  return parseCategory(data);
}

export async function deleteCategory(categoryId: string): Promise<void> {
  const { error } = await supabase.from("categories").delete().eq("id", categoryId);

  if (error) {
    throw new Error(`Failed to delete category: ${error.message}`);
  }
}

export async function fetchItems(filters: {
  categoryId?: string;
  published?: ItemPublishedFilter;
}): Promise<CatalogItem[]> {
  let query = supabase.from("items").select("*").order("updated_at", { ascending: false });

  if (filters.categoryId && filters.categoryId !== "all") {
    query = query.eq("category_id", filters.categoryId);
  }

  if (filters.published === "published") {
    query = query.eq("published", true);
  } else if (filters.published === "draft") {
    query = query.eq("published", false);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to load items: ${error.message}`);
  }

  return (data ?? []).map((row) => parseCatalogItem(row));
}

export async function saveItem(input: ItemInput): Promise<CatalogItem> {
  const itemId = input.id ?? crypto.randomUUID();
  const title = input.title.trim();
  const categoryId = input.categoryId.trim();

  if (!title) {
    throw new Error("Title is required.");
  }

  if (!categoryId) {
    throw new Error("Category is required.");
  }

  const tags = normalizeTags(input.tagsInput);
  const now = new Date().toISOString();

  let storagePath: string | null = input.existingStoragePath ?? null;
  let textBody: string | null = null;

  if (input.type === "text") {
    const normalizedText = (input.textBody ?? "").trim();
    if (!normalizedText) {
      throw new Error("Text body is required for text items.");
    }
    textBody = normalizedText;
    storagePath = null;
  } else {
    if (input.file) {
      const extension = resolveFileExtension(input.file);
      const expectedPrefix = `${input.type}/${itemId}`;
      const reusePath =
        storagePath && storagePath.startsWith(expectedPrefix) ? storagePath : `${expectedPrefix}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from("content")
        .upload(reusePath, input.file, {
          upsert: true,
          contentType: input.file.type || undefined,
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      storagePath = reusePath;
    }

    if (!storagePath) {
      throw new Error("File upload is required for pdf, audio or image items.");
    }

    textBody = null;
  }

  const parsed = parseCatalogItem({
    id: itemId,
    title,
    description: input.description?.trim() ? input.description.trim() : null,
    type: input.type,
    category_id: categoryId,
    tags,
    published: input.published,
    storage_path: storagePath,
    text_body: textBody,
    updated_at: now,
  });

  const { data, error } = await supabase
    .from("items")
    .upsert(parsed, { onConflict: "id" })
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to save item: ${error.message}`);
  }

  return parseCatalogItem(data);
}

export async function deleteItem(itemId: string): Promise<void> {
  const { error } = await supabase.from("items").delete().eq("id", itemId);

  if (error) {
    throw new Error(`Failed to delete item: ${error.message}`);
  }
}

export function getPublicFileUrl(path: string): string {
  const { data } = supabase.storage.from("content").getPublicUrl(path);
  return data.publicUrl;
}

function normalizeTags(tagsInput?: string): string[] | null {
  if (!tagsInput) {
    return null;
  }

  const values = tagsInput
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);

  return values.length > 0 ? values : null;
}

function resolveFileExtension(file: File): string {
  const byName = file.name.split(".").pop()?.trim().toLowerCase();
  if (byName) {
    return byName;
  }

  const byMime: Record<string, string> = {
    "application/pdf": "pdf",
    "audio/mpeg": "mp3",
    "audio/mp3": "mp3",
    "audio/wav": "wav",
    "audio/ogg": "ogg",
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/svg+xml": "svg",
  };

  return byMime[file.type] ?? "bin";
}
