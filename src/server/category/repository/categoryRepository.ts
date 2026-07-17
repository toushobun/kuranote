import type { CategoryRow } from "types/categories";
import { RepositoryError } from "server/shared/errors/appError";
import type { AuthenticatedSupabaseClient } from "server/shared/supabase/authenticatedClient";

export interface CategoryRepository {
  findActiveByLedgerId(ledgerId: string): Promise<CategoryRow[]>;
}

export function createSupabaseCategoryRepository(
  supabase: AuthenticatedSupabaseClient,
): CategoryRepository {
  return {
    async findActiveByLedgerId(ledgerId) {
      const { data, error } = await supabase
        .from("category")
        .select("id, name, icon_name, parent_id, type, sort_order, created_at")
        .eq("ledger_id", ledgerId)
        .eq("is_archived", false)
        .order("type", { ascending: true })
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true });

      if (error) {
        console.error("[category] failed to load categories", {
          ledgerId,
          message: error.message,
        });
        throw new RepositoryError(
          "category_load_failed",
          "分类加载失败，请稍后重试。",
        );
      }

      return (data ?? []) as CategoryRow[];
    },
  };
}
