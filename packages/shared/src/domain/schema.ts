import { z } from "zod";

const IsoDateTimeStringSchema = z.string().datetime({ offset: true });

const NonEmptyStringSchema = z.string().trim().min(1);

const CatalogItemBaseSchema = z.object({
  id: NonEmptyStringSchema,
  title: NonEmptyStringSchema,
  description: z.string().optional().nullable(),
  category_id: NonEmptyStringSchema,
  tags: z.array(z.string()).optional().nullable(),
  published: z.boolean(),
  updated_at: IsoDateTimeStringSchema,
});

export const ItemTypeSchema = z.enum(["pdf", "audio", "image", "text"]);

export const CategorySchema = z.object({
  id: NonEmptyStringSchema,
  name: NonEmptyStringSchema,
  sort_order: z.number().int(),
  published: z.boolean(),
  updated_at: IsoDateTimeStringSchema,
});

const CatalogItemPdfSchema = CatalogItemBaseSchema.extend({
  type: z.literal("pdf"),
  storage_path: NonEmptyStringSchema,
  text_body: z.null().optional(),
});

const CatalogItemAudioSchema = CatalogItemBaseSchema.extend({
  type: z.literal("audio"),
  storage_path: NonEmptyStringSchema,
  text_body: z.null().optional(),
});

const CatalogItemImageSchema = CatalogItemBaseSchema.extend({
  type: z.literal("image"),
  storage_path: NonEmptyStringSchema,
  text_body: z.null().optional(),
});

const CatalogItemTextSchema = CatalogItemBaseSchema.extend({
  type: z.literal("text"),
  storage_path: z.null().optional(),
  text_body: NonEmptyStringSchema,
});

export const CatalogItemSchema = z.discriminatedUnion("type", [
  CatalogItemPdfSchema,
  CatalogItemAudioSchema,
  CatalogItemImageSchema,
  CatalogItemTextSchema,
]);
