import type {
  AccountOptionDbRow,
  AppUserSummaryDbRow,
  CategorySummaryDbRow,
  MerchantSummaryDbRow,
  TransactionItemDbRow,
  TransactionRecordDbRow,
} from "internal/db-types";
import type { TransactionListItem } from "internal/transaction/service/read/transactionReadModels";
import {
  calculateTransactionRecordDisplayAmount,
  getTransactionRecordCategoryType,
} from "internal/transaction/util/transactionAmountHelpers";
import { resolveTransactionBusinessStatus } from "internal/transaction/entity/transactionSpecialStatus";
import type { ThemeColorKey } from "theme/themeColorTokens";

export function buildTransactionListItem({
  accountById,
  accountColorById,
  canEdit,
  categoryById,
  fallbackCurrency,
  merchantById,
  record,
  recorderById,
  recordItems,
  showRecorder = true,
}: {
  accountById: Map<string, AccountOptionDbRow>;
  accountColorById?: Map<string, ThemeColorKey>;
  canEdit: boolean;
  categoryById: Map<string, CategorySummaryDbRow>;
  fallbackCurrency: string;
  merchantById: Map<string, MerchantSummaryDbRow>;
  record: TransactionRecordDbRow;
  recorderById?: Map<string, AppUserSummaryDbRow>;
  recordItems: TransactionItemDbRow[];
  showRecorder?: boolean;
}): TransactionListItem {
  const recorder =
    record.created_by && recorderById
      ? recorderById.get(record.created_by)
      : undefined;

  if (record.type === "transfer") {
    return buildTransferListItem({
      accountById,
      accountColorById,
      canEdit,
      fallbackCurrency,
      record,
      recorder,
      recordItems,
      showRecorder,
    });
  }

  const firstItem = recordItems[0];
  const account = firstItem ? accountById.get(firstItem.account_id) : undefined;
  const merchant = record.merchant_id
    ? merchantById.get(record.merchant_id)
    : undefined;
  const displayAmount = calculateTransactionRecordDisplayAmount(
    recordItems,
    categoryById,
  );
  const displayType = getTransactionRecordCategoryType(
    recordItems,
    categoryById,
  );

  const categoryItems = recordItems.flatMap((item) => {
    if (item.category_id === null) return [];

    const category = categoryById.get(item.category_id);
    const parent = category?.parent_id
      ? categoryById.get(category.parent_id)
      : undefined;
    const businessStatus = resolveTransactionBusinessStatus({
      isRefundIncome: item.is_refund_income,
      isReimbursementIncome: item.is_reimbursement_income,
      specialStatus: item.special_status ?? null,
    });

    return [
      {
        accountId: item.account_id,
        amount: item.amount,
        ...(businessStatus ? { businessStatus } : {}),
        categoryName: category?.name ?? "",
        categoryType: category?.type,
        parentCategoryName: parent?.name ?? null,
        ...(item.id
          ? {
              id: item.id,
              refundedAmount: item.refunded_amount ?? "0",
              remainingRefundableAmount: String(
                Math.max(
                  0,
                  Number(item.amount) - Number(item.refunded_amount ?? 0),
                ),
              ),
            }
          : {}),
      },
    ];
  });

  return {
    account_color: firstItem
      ? (accountColorById?.get(firstItem.account_id) ?? null)
      : null,
    account_currency: account?.currency ?? fallbackCurrency,
    account_name: account?.name ?? "未知账户",
    amount: String(Math.abs(displayAmount)),
    canEdit,
    categoryItems,
    created_at: record.created_at,
    id: record.id,
    merchant_icon_url: merchant?.icon_url ?? null,
    merchant_name: merchant?.name ?? null,
    note: record.note ?? firstItem?.note ?? null,
    recorder_color: recorder?.display_color ?? null,
    recorder_name: recorder?.display_name ?? null,
    show_recorder: showRecorder,
    transaction_at: record.transaction_at,
    type: displayType,
  };
}

function buildTransferListItem({
  accountById,
  accountColorById,
  canEdit,
  fallbackCurrency,
  record,
  recorder,
  recordItems,
  showRecorder,
}: {
  accountById: Map<string, AccountOptionDbRow>;
  accountColorById?: Map<string, ThemeColorKey>;
  canEdit: boolean;
  fallbackCurrency: string;
  record: TransactionRecordDbRow;
  recorder: AppUserSummaryDbRow | undefined;
  recordItems: TransactionItemDbRow[];
  showRecorder: boolean;
}): TransactionListItem {
  const fromItem = recordItems.find(
    (item) => Number(item.balance_delta ?? "0") < 0,
  );
  const toItem = recordItems.find(
    (item) => Number(item.balance_delta ?? "0") > 0,
  );
  const fallbackItem = recordItems[0];

  const fromAccount = fromItem
    ? accountById.get(fromItem.account_id)
    : undefined;
  const toAccount = toItem ? accountById.get(toItem.account_id) : undefined;
  const fallbackAccount = fallbackItem
    ? accountById.get(fallbackItem.account_id)
    : undefined;

  const fromName = fromAccount?.name ?? "未知账户";
  const toName = toAccount?.name ?? "未知账户";
  const accountName =
    fromAccount || toAccount ? `${fromName} → ${toName}` : "未知账户";
  const accountColor = getTransferAccountColor({
    accountColorById,
    fallbackItem,
    fromItem,
    toItem,
  });

  const currency =
    fromAccount?.currency ??
    toAccount?.currency ??
    fallbackAccount?.currency ??
    fallbackCurrency;

  const amount = fromItem?.amount ?? fallbackItem?.amount ?? "0";

  return {
    account_color: accountColor,
    account_currency: currency,
    account_name: accountName,
    amount,
    canEdit,
    categoryItems: [],
    created_at: record.created_at,
    id: record.id,
    merchant_icon_url: null,
    merchant_name: null,
    note: record.note ?? null,
    recorder_color: recorder?.display_color ?? null,
    recorder_name: recorder?.display_name ?? null,
    show_recorder: showRecorder,
    transaction_at: record.transaction_at,
    type: "transfer",
  };
}

function getTransferAccountColor({
  accountColorById,
  fallbackItem,
  fromItem,
  toItem,
}: {
  accountColorById?: Map<string, ThemeColorKey>;
  fallbackItem: TransactionItemDbRow | undefined;
  fromItem: TransactionItemDbRow | undefined;
  toItem: TransactionItemDbRow | undefined;
}) {
  const fromColor = fromItem
    ? accountColorById?.get(fromItem.account_id)
    : undefined;
  const toColor = toItem ? accountColorById?.get(toItem.account_id) : undefined;

  if (fromItem && toItem) {
    return fromColor && fromColor === toColor ? fromColor : null;
  }

  return (
    fromColor ??
    toColor ??
    (fallbackItem
      ? (accountColorById?.get(fallbackItem.account_id) ?? null)
      : null)
  );
}
