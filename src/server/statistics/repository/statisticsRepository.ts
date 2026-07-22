import type { Logger } from "server/shared/logging/logger";
import type { AuthenticatedSupabaseClient } from "server/shared/supabase/authenticatedClient";
import { toRepositoryError } from "server/shared/supabase/repositoryError";
import type {
  CategorySummaryDbRow,
  MerchantSummaryDbRow,
  TransactionItemDbRow,
  TransactionRecordDbRow,
} from "server/db-types";
import { statisticsErrorCodes } from "server/statistics/errors";

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
  merchants: MerchantSummaryDbRow[];
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
        return { categories: [], items: [], merchants: [], records: [] };
      }

      const { data: itemData, error: itemError } = await supabase
        .from("transaction_item")
        .select(
          "transaction_record_id, account_id, category_id, amount, balance_delta, note",
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
      const merchantIds = [
        ...new Set(
          records
            .map((record) => record.merchant_id)
            .filter((merchantId): merchantId is string => merchantId !== null),
        ),
      ];

      const [categoryResult, merchantResult] = await Promise.all([
        categoryIds.length > 0
          ? supabase
              .from("category")
              .select("id, name, parent_id, type")
              .eq("ledger_id", ledgerId)
              .in("id", categoryIds)
          : Promise.resolve({ data: [], error: null }),
        merchantIds.length > 0
          ? supabase
              .from("merchant")
              .select("id, name, icon_url")
              .eq("ledger_id", ledgerId)
              .in("id", merchantIds)
          : Promise.resolve({ data: [], error: null }),
      ]);

      if (categoryResult.error || merchantResult.error) {
        fail(
          "failed to load monthly relations",
          statisticsErrorCodes.monthlyLoadFailed,
          "统计关联数据加载失败，请稍后重试。",
          { ledgerId },
          categoryResult.error ?? merchantResult.error ?? undefined,
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
        merchants: (merchantResult.data ?? []) as MerchantSummaryDbRow[],
        records,
      };
    },
  };
}
