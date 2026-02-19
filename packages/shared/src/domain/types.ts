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
  storage_path?: string | null;
  text_body: string;
};

type CatalogItemPdf = CatalogItemBase & {
  type: "pdf";
  storage_path: string;
  text_body?: null;
};

type CatalogItemAudio = CatalogItemBase & {
  type: "audio";
  storage_path: string;
  text_body?: null;
};

type CatalogItemImage = CatalogItemBase & {
  type: "image";
  storage_path: string;
  text_body?: string | null;
};

export type CatalogItemBinary = CatalogItemPdf | CatalogItemAudio | CatalogItemImage;

export type CatalogItem = CatalogItemText | CatalogItemBinary;
