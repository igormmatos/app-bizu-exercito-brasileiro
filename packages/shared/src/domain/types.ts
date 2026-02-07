export type ItemType = "pdf" | "audio" | "image" | "text";

export type Category = {
  id: string;
  name: string;
  sort_order: number;
  published: boolean;
  updated_at: string;
};

type CatalogItemBase = {
  id: string;
  title: string;
  description?: string | null;
  category_id: string;
  tags?: string[] | null;
  published: boolean;
  updated_at: string;
};

export type CatalogItemText = CatalogItemBase & {
  type: "text";
  storage_path?: null;
  text_body: string;
};

type CatalogItemBinaryType = Exclude<ItemType, "text">;

export type CatalogItemBinary = CatalogItemBase & {
  type: CatalogItemBinaryType;
  storage_path: string;
  text_body?: null;
};

export type CatalogItem = CatalogItemText | CatalogItemBinary;
