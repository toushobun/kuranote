import type { Logger } from "internal/shared/logging/logger";
import type { AuthenticatedSupabaseClient } from "internal/shared/supabase/authenticatedClient";
import { toRepositoryError } from "internal/shared/supabase/repositoryError";

export type TransactionIncomeLinkedItem = {
  accountId: string;
  amount: string;
  categoryId: string;
  id: string;
  refundedAmount: string;
  transactionAt: string;
  transactionRecordId: string;
};

export type TransactionIncomeRefundAllocation = {
  refundAmount: string;
  refundedItem: TransactionIncomeLinkedItem;
};

export type TransactionIncomeLinkData = {
  incomeItemId: string;
  refundAllocations: TransactionIncomeRefundAllocation[];
  reimbursementItems: TransactionIncomeLinkedItem[];
};

export interface TransactionIncomeLinkRepository {
  listByIncomeItemIds(
    ledgerId: string,
    incomeItemIds: string[],
  ): Promise<TransactionIncomeLinkData[]>;
}

type RefundLinkRow = {
  refund_amount: string;
  refund_income_item_id: string;
  refunded_item_id: string;
};

type LinkedItemRow = {
  account_id: string;
  amount: string;
  category_id: string | null;
  id: string;
  refunded_amount: string | null;
  settled_by_item_id: string | null;
  transaction_record_id: string;
};

type TransactionAtRow = {
  id: string;
  transaction_at: string;
};

export function createSupabaseTransactionIncomeLinkRepository(
  supabase: AuthenticatedSupabaseClient,
  logger: Logger,
): TransactionIncomeLinkRepository {
  function throwLoadError(
    operation: string,
    databaseCode: string | undefined,
    ledgerId: string,
  ): never {
    logger.error(`[transaction] ${operation}`, { databaseCode, ledgerId });
    throw toRepositoryError(
      "transaction_income_links_load_failed",
      "收入关联信息加载失败，请稍后重试。",
    );
  }

  return {
    async listByIncomeItemIds(ledgerId, incomeItemIds) {
      const uniqueIncomeItemIds = [...new Set(incomeItemIds)];
      if (uniqueIncomeItemIds.length === 0) return [];

      const [refundLinkResult, reimbursementResult] = await Promise.all([
        supabase
          .from("transaction_item_refund_link")
          .select("refund_income_item_id, refunded_item_id, refund_amount")
          .eq("ledger_id", ledgerId)
          .in("refund_income_item_id", uniqueIncomeItemIds),
        supabase
          .from("transaction_item_with_refund")
          .select(
            "id, transaction_record_id, account_id, category_id, amount, refunded_amount, settled_by_item_id",
          )
          .eq("ledger_id", ledgerId)
          .in("settled_by_item_id", uniqueIncomeItemIds),
      ]);

      if (refundLinkResult.error) {
        throwLoadError(
          "failed to load refund income links",
          refundLinkResult.error.code,
          ledgerId,
        );
      }
      if (reimbursementResult.error) {
        throwLoadError(
          "failed to load reimbursement income links",
          reimbursementResult.error.code,
          ledgerId,
        );
      }

      const refundLinks = (refundLinkResult.data ?? []) as RefundLinkRow[];
      const reimbursementItems = (reimbursementResult.data ??
        []) as LinkedItemRow[];
      const refundedItemIds = [
        ...new Set(refundLinks.map((link) => link.refunded_item_id)),
      ];
      const refundedItemResult =
        refundedItemIds.length === 0
          ? { data: [] as LinkedItemRow[], error: null }
          : await supabase
              .from("transaction_item_with_refund")
              .select(
                "id, transaction_record_id, account_id, category_id, amount, refunded_amount, settled_by_item_id",
              )
              .eq("ledger_id", ledgerId)
              .in("id", refundedItemIds);

      if (refundedItemResult.error) {
        throwLoadError(
          "failed to load refunded items",
          refundedItemResult.error.code,
          ledgerId,
        );
      }

      const refundedItems = (refundedItemResult.data ?? []) as LinkedItemRow[];
      const allItems = [...reimbursementItems, ...refundedItems];
      const transactionRecordIds = [
        ...new Set(allItems.map((item) => item.transaction_record_id)),
      ];
      const recordResult =
        transactionRecordIds.length === 0
          ? { data: [] as TransactionAtRow[], error: null }
          : await supabase
              .from("transaction_record")
              .select("id, transaction_at")
              .eq("ledger_id", ledgerId)
              .eq("status", "active")
              .in("id", transactionRecordIds);

      if (recordResult.error) {
        throwLoadError(
          "failed to load linked transaction records",
          recordResult.error.code,
          ledgerId,
        );
      }

      const transactionAtByRecordId = new Map(
        ((recordResult.data ?? []) as TransactionAtRow[]).map((record) => [
          record.id,
          record.transaction_at,
        ]),
      );
      const linkedItemById = new Map(
        allItems.flatMap((item) => {
          const linkedItem = buildLinkedItem(item, transactionAtByRecordId);
          return linkedItem ? [[linkedItem.id, linkedItem] as const] : [];
        }),
      );
      const refundLinksByIncomeItemId = new Map<string, RefundLinkRow[]>();
      for (const link of refundLinks) {
        const current =
          refundLinksByIncomeItemId.get(link.refund_income_item_id) ?? [];
        current.push(link);
        refundLinksByIncomeItemId.set(link.refund_income_item_id, current);
      }
      const reimbursementItemsByIncomeItemId = new Map<
        string,
        TransactionIncomeLinkedItem[]
      >();

      for (const item of reimbursementItems) {
        if (!item.settled_by_item_id) continue;
        const linkedItem = linkedItemById.get(item.id);
        if (!linkedItem) continue;
        const current =
          reimbursementItemsByIncomeItemId.get(item.settled_by_item_id) ?? [];
        current.push(linkedItem);
        reimbursementItemsByIncomeItemId.set(item.settled_by_item_id, current);
      }

      return uniqueIncomeItemIds.map((incomeItemId) => ({
        incomeItemId,
        refundAllocations: (refundLinksByIncomeItemId.get(incomeItemId) ?? [])
          .flatMap((link) => {
            const refundedItem = linkedItemById.get(link.refunded_item_id);
            return refundedItem
              ? [{ refundAmount: link.refund_amount, refundedItem }]
              : [];
          })
          .sort((left, right) =>
            left.refundedItem.id.localeCompare(right.refundedItem.id),
          ),
        reimbursementItems:
          reimbursementItemsByIncomeItemId.get(incomeItemId) ?? [],
      }));
    },
  };
}

function buildLinkedItem(
  item: LinkedItemRow,
  transactionAtByRecordId: Map<string, string>,
): TransactionIncomeLinkedItem | null {
  const transactionAt = transactionAtByRecordId.get(item.transaction_record_id);
  if (!transactionAt || !item.category_id) return null;

  return {
    accountId: item.account_id,
    amount: item.amount,
    categoryId: item.category_id,
    id: item.id,
    refundedAmount: item.refunded_amount ?? "0",
    transactionAt,
    transactionRecordId: item.transaction_record_id,
  };
}
