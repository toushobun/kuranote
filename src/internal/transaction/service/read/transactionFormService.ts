import type { CurrentLedger } from "internal/ledger";
import { canModifyTransaction, canWriteTransaction } from "internal/ledger";
import type { TransactionItemDbRow } from "internal/db-types";
import type { TransactionFormRepository } from "internal/transaction/repository/transactionRepository";
import { loadTransactionFormOptions } from "internal/transaction/service/read/options";
import type { TransactionReadDependencies } from "internal/transaction/service/read/transactionContext";
import type {
  EditTransactionView,
  TransactionAccountOption,
  TransactionCategoryOption,
  TransferEditInitialValues,
  NewTransactionView,
} from "internal/transaction/service/read/transactionReadModels";
import type { TransactionType } from "internal/transaction/entity/transactionType";
import { fromTransactionSpecialStatusStorageValue } from "internal/transaction/entity/transactionSpecialStatus";

export async function getNewTransactionView(
  dependencies: TransactionReadDependencies<TransactionFormRepository>,
  currentLedger: CurrentLedger,
): Promise<NewTransactionView> {
  const [options, pendingItems] = await Promise.all([
    loadTransactionFormOptions(dependencies, currentLedger),
    dependencies.transactionRepository.listPendingReimbursementItems(
      currentLedger.id,
    ),
  ]);
  return {
    ...options,
    canWriteTransactions: canWriteTransaction(currentLedger.currentUserRole),
    ledgerName: currentLedger.name,
    reimbursementCandidates: buildReimbursementCandidates(
      pendingItems,
      options.accountOptions,
      options.categoryOptions,
    ),
  };
}

export async function getEditTransactionView(
  dependencies: TransactionReadDependencies<TransactionFormRepository>,
  currentLedger: CurrentLedger,
  transactionRecordId: string,
): Promise<EditTransactionView | null> {
  const [options, record, pendingItems] = await Promise.all([
    loadTransactionFormOptions(dependencies, currentLedger),
    dependencies.transactionRepository.findActiveRecord(
      currentLedger.id,
      transactionRecordId,
    ),
    dependencies.transactionRepository.listPendingReimbursementItems(
      currentLedger.id,
    ),
  ]);
  if (!record) return null;

  const canEdit = canModifyTransaction({
    createdBy: record.created_by ?? null,
    role: currentLedger.currentUserRole,
    userId: dependencies.currentUserId,
  });
  const items = await dependencies.transactionRepository.listItems(
    currentLedger.id,
    [transactionRecordId],
  );

  if (record.type === "transfer") {
    const fromItems = items.filter((item) => Number(item.balance_delta) < 0);
    const toItems = items.filter((item) => Number(item.balance_delta) > 0);
    const fromItem = fromItems[0];
    const toItem = toItems[0];
    if (
      items.length !== 2 ||
      fromItems.length !== 1 ||
      toItems.length !== 1 ||
      !fromItem ||
      !toItem ||
      !isValidTransferPair(fromItem, toItem)
    ) {
      return null;
    }

    return {
      ...options,
      canEdit,
      initialValues: {
        accountId: fromItem.account_id,
        note: record.note ?? "",
        transactionAt: record.transaction_at,
        transactionRecordId: record.id,
        transferAmount: formatEditableAmount(fromItem.amount),
        transferTargetAccountId: toItem.account_id,
        type: "transfer" as const,
      } satisfies TransferEditInitialValues,
      ledgerName: currentLedger.name,
      reimbursementCandidates: buildReimbursementCandidates(
        pendingItems,
        options.accountOptions,
        options.categoryOptions,
      ),
    };
  }

  if (record.type !== "normal" || items.length === 0) return null;

  return {
    ...options,
    canEdit,
    initialValues: {
      accountId: items[0]?.account_id ?? "",
      items: items.map((item) => ({
        amount: formatEditableAmount(item.amount),
        categoryId: item.category_id ?? "",
        id: item.id,
        refundedAmount: item.refunded_amount ?? "0",
        specialStatus: fromTransactionSpecialStatusStorageValue(
          item.special_status ?? null,
        ),
      })),
      merchantId: record.merchant_id ?? "",
      note: record.note ?? "",
      transactionAt: record.transaction_at,
      transactionRecordId: record.id,
      type: resolveNormalTransactionDisplayType(items, options.categoryOptions),
    },
    ledgerName: currentLedger.name,
    reimbursementCandidates: buildReimbursementCandidates(
      pendingItems,
      options.accountOptions,
      options.categoryOptions,
    ),
  };
}

function buildReimbursementCandidates(
  items: Awaited<
    ReturnType<TransactionFormRepository["listPendingReimbursementItems"]>
  >,
  accounts: TransactionAccountOption[],
  categories: TransactionCategoryOption[],
) {
  const accountById = new Map(accounts.map((account) => [account.id, account]));
  const categoryById = new Map(
    categories.map((category) => [category.id, category]),
  );
  return items.map((item) => ({
    accountCurrency: accountById.get(item.account_id)?.currency ?? "JPY",
    amount: item.amount,
    categoryName: categoryById.get(item.category_id)?.name ?? "未知分类",
    id: item.id,
    transactionAt: item.transaction_at,
  }));
}

function isValidTransferPair(
  fromItem: TransactionItemDbRow,
  toItem: TransactionItemDbRow,
) {
  const fromAmount = Number(fromItem.amount);
  const toAmount = Number(toItem.amount);
  const fromDelta = Number(fromItem.balance_delta);
  const toDelta = Number(toItem.balance_delta);
  return (
    fromAmount === toAmount &&
    fromAmount === Math.abs(fromDelta) &&
    toAmount === Math.abs(toDelta) &&
    fromDelta + toDelta === 0
  );
}

export function resolveNormalTransactionDisplayType(
  items: TransactionItemDbRow[],
  categoryOptions: TransactionCategoryOption[],
): TransactionType {
  const categoryTypeById = new Map(
    categoryOptions.map((category) => [category.id, category.type] as const),
  );
  let expenseTotal = 0;
  let incomeTotal = 0;

  for (const item of items) {
    const amount = Number(item.amount);
    if (!Number.isFinite(amount)) continue;
    const categoryType = item.category_id
      ? categoryTypeById.get(item.category_id)
      : undefined;
    if (categoryType === "income") incomeTotal += amount;
    else if (categoryType === "expense") expenseTotal += amount;
  }

  if (incomeTotal > expenseTotal) return "income";
  if (expenseTotal > incomeTotal) return "expense";
  return "income";
}

export function formatEditableAmount(amount: string) {
  const value = Number(amount);
  if (!Number.isFinite(value)) return amount;
  return value
    .toFixed(2)
    .replace(/\.00$/, "")
    .replace(/(\.\d)0$/, "$1");
}
