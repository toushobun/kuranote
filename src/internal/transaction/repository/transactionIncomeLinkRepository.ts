import type { Logger } from "internal/shared/logging/logger";
import type { AuthenticatedSupabaseClient } from "internal/shared/supabase/authenticatedClient";
import { toRepositoryError } from "internal/shared/supabase/repositoryError";
import { transactionLoadErrorMessages } from "internal/transaction/errors";

export type TransactionIncomeLinkedItem = {
  accountId: string;
  amount: string;
  categoryId: string;
  id: string;
  refundedAmount: string;
  reimbursementAmount: string;
  transactionAt: string;
  transactionRecordId: string;
};

export type TransactionIncomeRefundItem = TransactionIncomeLinkedItem & {
  refundLinkAmount: string;
};

export type TransactionIncomeReimbursementItem = TransactionIncomeLinkedItem & {
  reimbursementLinkAmount: string;
};

export type TransactionIncomeLinkData = {
  incomeItemId: string;
  refundItem: TransactionIncomeRefundItem | null;
  reimbursementItems: TransactionIncomeReimbursementItem[];
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

type ReimbursementLinkRow = {
  reimbursement_amount: string;
  reimbursement_income_item_id: string;
  target_expense_item_id: string;
};

type LinkedItemRow = {
  amount: string;
  category_id: string | null;
  id: string;
  refunded_amount: string | null;
  reimbursement_amount: string | null;
  transaction_record_id: string;
};

type TransactionAtRow = {
  id: string;
  transaction_at: string;
};

type FirstPaymentAccountRow = {
  account_id: string;
  transaction_record_id: string;
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
      transactionLoadErrorMessages.incomeLinksLoadFailed,
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
          .from("transaction_item_reimbursement_link")
          .select(
            "reimbursement_income_item_id, target_expense_item_id, reimbursement_amount",
          )
          .eq("ledger_id", ledgerId)
          .in("reimbursement_income_item_id", uniqueIncomeItemIds),
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
      const reimbursementLinks = (reimbursementResult.data ??
        []) as ReimbursementLinkRow[];
      const linkedItemIds = [
        ...new Set([
          ...refundLinks.map((link) => link.refunded_item_id),
          ...reimbursementLinks.map((link) => link.target_expense_item_id),
        ]),
      ];
      const refundedItemResult =
        linkedItemIds.length === 0
          ? { data: [] as LinkedItemRow[], error: null }
          : await supabase
              .from("transaction_item_with_refund")
              .select(
                "id, transaction_record_id, category_id, amount, refunded_amount, reimbursement_amount",
              )
              .eq("ledger_id", ledgerId)
              .in("id", linkedItemIds);

      if (refundedItemResult.error) {
        throwLoadError(
          "failed to load refunded items",
          refundedItemResult.error.code,
          ledgerId,
        );
      }

      const refundedItems = (refundedItemResult.data ?? []) as LinkedItemRow[];
      const transactionRecordIds = [
        ...new Set(refundedItems.map((item) => item.transaction_record_id)),
      ];
      const [recordResult, paymentResult] =
        transactionRecordIds.length === 0
          ? [
              { data: [] as TransactionAtRow[], error: null },
              { data: [] as FirstPaymentAccountRow[], error: null },
            ]
          : await Promise.all([
              supabase
                .from("transaction_record")
                .select("id, transaction_at")
                .eq("ledger_id", ledgerId)
                .eq("status", "active")
                .in("id", transactionRecordIds),
              // 关联对方（普通记录）的账户改读付款明细：首个付款账户即可代表
              // 记录币种（不变量保证同笔记录的付款账户同币种）。
              supabase
                .from("transaction_payment")
                .select("account_id, transaction_record_id")
                .eq("ledger_id", ledgerId)
                .in("transaction_record_id", transactionRecordIds)
                .order("sort_order", { ascending: true }),
            ]);

      if (recordResult.error) {
        throwLoadError(
          "failed to load linked transaction records",
          recordResult.error.code,
          ledgerId,
        );
      }
      if (paymentResult.error) {
        throwLoadError(
          "failed to load linked transaction payments",
          paymentResult.error.code,
          ledgerId,
        );
      }

      const transactionAtByRecordId = new Map(
        ((recordResult.data ?? []) as TransactionAtRow[]).map((record) => [
          record.id,
          record.transaction_at,
        ]),
      );
      const firstAccountIdByRecordId = new Map<string, string>();
      for (const payment of (paymentResult.data ??
        []) as FirstPaymentAccountRow[]) {
        if (!firstAccountIdByRecordId.has(payment.transaction_record_id)) {
          firstAccountIdByRecordId.set(
            payment.transaction_record_id,
            payment.account_id,
          );
        }
      }
      const linkedItemById = new Map(
        refundedItems.flatMap((item) => {
          const linkedItem = buildLinkedItem(
            item,
            transactionAtByRecordId,
            firstAccountIdByRecordId,
          );
          return linkedItem ? [[linkedItem.id, linkedItem] as const] : [];
        }),
      );
      const refundItemByIncomeItemId = new Map<
        string,
        TransactionIncomeRefundItem
      >();
      for (const link of refundLinks) {
        const linkedItem = linkedItemById.get(link.refunded_item_id);
        if (!linkedItem) continue;
        refundItemByIncomeItemId.set(link.refund_income_item_id, {
          ...linkedItem,
          refundLinkAmount: link.refund_amount,
        });
      }

      const reimbursementItemsByIncomeItemId = new Map<
        string,
        TransactionIncomeReimbursementItem[]
      >();
      for (const link of reimbursementLinks) {
        const linkedItem = linkedItemById.get(link.target_expense_item_id);
        if (!linkedItem) continue;
        const current =
          reimbursementItemsByIncomeItemId.get(
            link.reimbursement_income_item_id,
          ) ?? [];
        current.push({
          ...linkedItem,
          reimbursementLinkAmount: link.reimbursement_amount,
        });
        reimbursementItemsByIncomeItemId.set(
          link.reimbursement_income_item_id,
          current,
        );
      }

      return uniqueIncomeItemIds.map((incomeItemId) => ({
        incomeItemId,
        refundItem: refundItemByIncomeItemId.get(incomeItemId) ?? null,
        reimbursementItems:
          reimbursementItemsByIncomeItemId.get(incomeItemId) ?? [],
      }));
    },
  };
}

function buildLinkedItem(
  item: LinkedItemRow,
  transactionAtByRecordId: Map<string, string>,
  firstAccountIdByRecordId: Map<string, string>,
): TransactionIncomeLinkedItem | null {
  const transactionAt = transactionAtByRecordId.get(item.transaction_record_id);
  const accountId = firstAccountIdByRecordId.get(item.transaction_record_id);
  if (!transactionAt || !item.category_id || !accountId) return null;

  return {
    accountId,
    amount: item.amount,
    categoryId: item.category_id,
    id: item.id,
    refundedAmount: item.refunded_amount ?? "0",
    reimbursementAmount: item.reimbursement_amount ?? "0",
    transactionAt,
    transactionRecordId: item.transaction_record_id,
  };
}
