import type { Logger } from "internal/shared/logging/logger";
import type { AuthenticatedSupabaseClient } from "internal/shared/supabase/authenticatedClient";
import { toRepositoryError } from "internal/shared/supabase/repositoryError";
import type {
  CategorySummaryDbRow,
  TransactionItemDbRow,
  TransactionRecordDbRow,
} from "internal/db-types";
import { statisticsErrorCodes } from "internal/statistics/errors";

export type StatisticsLedgerSummary = {
  baseCurrency: string;
  id: string;
  name: string;
};

export type DashboardAccountSummaryRecord = {
  createdAt: string;
  currentBalance: number | string;
  currency: string;
  id: string;
  name: string;
  sortOrder: number;
  type: string;
};

export type MonthlyStatisticsSource = {
  categories: CategorySummaryDbRow[];
  items: TransactionItemDbRow[];
  records: TransactionRecordDbRow[];
};

export interface StatisticsRepository {
  findLedger(ledgerId: string): Promise<StatisticsLedgerSummary | null>;
  listDashboardAccounts(
    ledgerId: string,
  ): Promise<DashboardAccountSummaryRecord[]>;
  loadMonthlySource(input: {
    dateEnd: string;
    dateStart: string;
    ledgerId: string;
  }): Promise<MonthlyStatisticsSource>;
}

export function createSupabaseStatisticsRepository(
  supabase: AuthenticatedSupabaseClient,
  logger: Logger,
): StatisticsRepository {
  function fail(
    operation: string,
    code: string,
    message: string,
    details: Record<string, unknown>,
    error?: { code?: string | null },
  ): never {
    logger.error(`[statistics] ${operation}`, {
      ...details,
      databaseCode: error?.code,
    });
    throw toRepositoryError(code, message);
  }

  return {
    async findLedger(ledgerId) {
      const { data, error } = await supabase
        .from("ledger")
        .select("id, name, base_currency")
        .eq("id", ledgerId)
        .eq("is_archived", false)
        .maybeSingle();

      if (error) {
        fail(
          "failed to load ledger",
          statisticsErrorCodes.ledgerInvalid,
          "账本信息加载失败，请稍后重试。",
          { ledgerId },
          error,
        );
      }

      return data
        ? {
            baseCurrency: data.base_currency,
            id: data.id,
            name: data.name,
          }
        : null;
    },

    async listDashboardAccounts(ledgerId) {
      const { data, error } = await supabase
        .from("account")
        .select(
          "id, name, type, currency, current_balance, sort_order, created_at",
        )
        .eq("ledger_id", ledgerId)
        .eq("is_archived", false)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });

      if (error) {
        fail(
          "failed to load dashboard accounts",
          statisticsErrorCodes.dashboardLoadFailed,
          "Dashboard 账户摘要加载失败，请稍后重试。",
          { ledgerId },
          error,
        );
      }

      return (data ?? []).map((row) => ({
        createdAt: row.created_at,
        currentBalance: row.current_balance,
        currency: row.currency,
        id: row.id,
        name: row.name,
        sortOrder: row.sort_order,
        type: row.type,
      }));
    },

    async loadMonthlySource({ dateEnd, dateStart, ledgerId }) {
      const { data: recordData, error: recordError } = await supabase
        .from("transaction_record")
        .select(
          "id, type, transaction_at, merchant_id, note, created_by, created_at",
        )
        .eq("ledger_id", ledgerId)
        .eq("status", "active")
        .eq("type", "normal")
        .gte("transaction_at", dateStart)
        .lt("transaction_at", dateEnd);

      if (recordError) {
        fail(
          "failed to load monthly records",
          statisticsErrorCodes.monthlyLoadFailed,
          "统计数据加载失败，请稍后重试。",
          { ledgerId },
          recordError,
        );
      }

      const records = (recordData ?? []) as TransactionRecordDbRow[];
      const recordIds = records.map((record) => record.id);

      if (recordIds.length === 0) {
        return { categories: [], items: [], records: [] };
      }

      const { data: itemData, error: itemError } = await supabase
        .from("transaction_item_with_refund")
        .select(
          "transaction_record_id, category_id, amount, business_net_amount, has_refund_link, has_reimbursement_link",
        )
        .eq("ledger_id", ledgerId)
        .in("transaction_record_id", recordIds);

      if (itemError) {
        fail(
          "failed to load monthly items",
          statisticsErrorCodes.monthlyLoadFailed,
          "统计数据加载失败，请稍后重试。",
          { ledgerId },
          itemError,
        );
      }

      const items = (itemData ?? []) as TransactionItemDbRow[];
      const categoryIds = [
        ...new Set(
          items
            .map((item) => item.category_id)
            .filter((categoryId): categoryId is string => categoryId !== null),
        ),
      ];
      const categoryResult =
        categoryIds.length > 0
          ? await supabase
              .from("category")
              .select("id, name, parent_id, type")
              .eq("ledger_id", ledgerId)
              .in("id", categoryIds)
          : { data: [], error: null };

      if (categoryResult.error) {
        fail(
          "failed to load monthly categories",
          statisticsErrorCodes.monthlyLoadFailed,
          "统计关联数据加载失败，请稍后重试。",
          { ledgerId },
          categoryResult.error,
        );
      }

      const categories = (categoryResult.data ?? []) as CategorySummaryDbRow[];
      const parentCategoryIds = [
        ...new Set(
          categories
            .map((category) => category.parent_id)
            .filter((categoryId): categoryId is string => categoryId !== null),
        ),
      ].filter((categoryId) => !categoryIds.includes(categoryId));

      if (parentCategoryIds.length > 0) {
        const { data, error } = await supabase
          .from("category")
          .select("id, name, parent_id, type")
          .eq("ledger_id", ledgerId)
          .in("id", parentCategoryIds);

        if (error) {
          fail(
            "failed to load monthly parent categories",
            statisticsErrorCodes.monthlyLoadFailed,
            "统计分类数据加载失败，请稍后重试。",
            { ledgerId },
            error,
          );
        }

        categories.push(...((data ?? []) as CategorySummaryDbRow[]));
      }

      return {
        categories,
        items,
        records,
      };
    },
  };
}
