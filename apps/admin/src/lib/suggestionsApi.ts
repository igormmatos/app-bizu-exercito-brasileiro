import { supabase } from "./supabaseClient";

export type SuggestionStatus = "new" | "triaged" | "done";
export type SuggestionStatusFilter = "all" | SuggestionStatus;

export type Suggestion = {
  id: string;
  created_at: string;
  category: string | null;
  contact: string | null;
  message: string;
  status: SuggestionStatus;
  app_version: string | null;
  device: string | null;
};

export type ListSuggestionsParams = {
  page: number;
  pageSize?: number;
  status?: SuggestionStatusFilter;
  category?: string;
  search?: string;
};

export type ListSuggestionsResult = {
  items: Suggestion[];
  hasMore: boolean;
};

export class SuggestionsPermissionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SuggestionsPermissionError";
  }
}

const PAGE_SIZE_DEFAULT = 50;

export async function listSuggestions(params: ListSuggestionsParams): Promise<ListSuggestionsResult> {
  const pageSize = params.pageSize ?? PAGE_SIZE_DEFAULT;
  const page = Math.max(0, params.page);
  const rangeFrom = page * pageSize;
  const rangeTo = rangeFrom + pageSize - 1;

  let query = supabase
    .from("suggestions")
    .select("id, created_at, category, contact, message, status, app_version, device")
    .order("created_at", { ascending: false })
    .range(rangeFrom, rangeTo);

  if (params.status && params.status !== "all") {
    query = query.eq("status", params.status);
  }

  const normalizedCategory = params.category?.trim();
  if (normalizedCategory && normalizedCategory !== "all") {
    query = query.eq("category", normalizedCategory);
  }

  const normalizedSearch = params.search?.trim();
  if (normalizedSearch) {
    query = query.ilike("message", `%${normalizedSearch}%`);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`Failed to load suggestions: ${error.message}`);
  }

  const items = (data ?? []) as Suggestion[];

  return {
    items,
    hasMore: items.length === pageSize,
  };
}

export async function updateSuggestionStatus(
  suggestionId: string,
  status: SuggestionStatus,
): Promise<Suggestion> {
  const { data, error } = await supabase
    .from("suggestions")
    .update({ status })
    .eq("id", suggestionId)
    .select("id, created_at, category, contact, message, status, app_version, device")
    .single();

  if (error) {
    if (isPermissionError(error.code, error.message)) {
      throw new SuggestionsPermissionError("Sem permissão para alterar status; somente leitura.");
    }
    throw new Error(`Failed to update suggestion status: ${error.message}`);
  }

  return data as Suggestion;
}

function isPermissionError(code?: string, message?: string): boolean {
  if (code === "42501") {
    return true;
  }

  const normalizedMessage = (message ?? "").toLowerCase();
  return (
    normalizedMessage.includes("permission denied") ||
    normalizedMessage.includes("row-level security") ||
    normalizedMessage.includes("not allowed")
  );
}
