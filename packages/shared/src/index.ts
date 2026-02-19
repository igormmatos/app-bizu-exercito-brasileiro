import { z, ZodError } from "zod";
import { CatalogItemSchema, CategorySchema } from "./domain/schema";
import type { CatalogItem, Category } from "./domain/types";
import type { HtmlBlockNode, HtmlInlineNode } from "./html/safeHtml";
import { parseSafeHtml } from "./html/safeHtml";

export type { CatalogItem, Category, ItemType } from "./domain/types";
export { CatalogItemSchema, CategorySchema } from "./domain/schema";
export type { HtmlBlockNode, HtmlInlineNode };
export { parseSafeHtml };

function formatZodError(prefix: string, error: ZodError): Error {
  const details = error.issues
    .map((issue) => `${issue.path.join(".") || "root"}: ${issue.message}`)
    .join("; ");
  return new Error(`${prefix}: ${details}`);
}

export function parseCategory(input: unknown): Category {
  try {
    return CategorySchema.parse(input);
  } catch (error) {
    if (error instanceof ZodError) {
      throw formatZodError("Invalid Category", error);
    }
    throw error;
  }
}

export function parseCatalogItem(input: unknown): CatalogItem {
  try {
    return CatalogItemSchema.parse(input);
  } catch (error) {
    if (error instanceof ZodError) {
      throw formatZodError("Invalid CatalogItem", error);
    }
    throw error;
  }
}

export function parseCatalogItems(input: unknown): CatalogItem[] {
  const CatalogItemsSchema = z.array(CatalogItemSchema);

  try {
    return CatalogItemsSchema.parse(input);
  } catch (error) {
    if (error instanceof ZodError) {
      throw formatZodError("Invalid CatalogItem[]", error);
    }
    throw error;
  }
}
