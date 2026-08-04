import type { CurrentLedger } from "internal/ledger";
import { canModifyTransaction, canWriteTransaction } from "internal/ledger";
import type { TransactionItemDbRow } from "internal/db-types";
import type {
  TransactionIncomeLinkData,
  TransactionIncomeLinkedItem,
  TransactionIncomeLinkRepository,
} from "internal/transaction/repository/transactionIncomeLinkRepository";
import type { TransactionFormRepository } from "internal/transaction/repository/transactionRepository";
import { loadTransactionFormOptions } from "internal/transaction/service/read/options";
import type { TransactionReadDependencies } from "internal/transaction/service/read/transactionContext";
import type {
  EditTransactionView,
  NewTransactionView,
  TransactionAccountOption,
  TransactionCategoryOption,
  TransferEditInitialValues,
} from "internal/transaction/service/read/transactionReadModels";
import type { TransactionType } from "internal/transaction/entity/transactionType";
import {
  fromTransactionSpecialStatusStorageValue,
  resolveTransactionBusinessStatus,
} from "internal/transaction/entity/transactionSpecialStatus";

type TransactionFormReadDependencies =
  TransactionReadDependencies<TransactionFormRepository> & {
    transactionIncomeLinkRepository?: TransactionIncomeLinkRepository;
  };

export async function getNewTransactionView(
  dependencies: TransactionReadDependencies<TransactionFormRepository>,
  currentLedger: CurrentLedger,
): Promise<NewTransactionView> {
  const specialStatusEnabled = Boolean(
    currentLedger.transactionItemSpecialStatusEnabled,
  );
  const [options, pendingItems] = await Promise.all([
    loadTransactionFormOptions(dependencies, currentLedger),
    specialStatusEnabled
      ? dependencies.transactionRepository.listPendingReimbursementItems(
          currentLedger.id,
        )
      : Promise.resolve([]),
  ]);
  return {
    ...options,
    canWriteTransactions: canWriteTransaction(currentLedger.currentUserRole),
    ledgerName: currentLedger.name,
    reimbursementCandidates: buildReimbursementCandidates(
      pendingItems,
      options.accountOptions,
      options.categoryOptions,
      currentLedger.baseCurrency,
    ),
  };
}

export async function getEditTransactionView(
  dependencies: TransactionFormReadDependencies,
  currentLedger: CurrentLedger,
  transactionRecordId: string,
): Promise<EditTransactionView | null> {
  const [options, record] = await Promise.all([
    loadTransactionFormOptions(dependencies, currentLedger),
    dependencies.transactionRepository.findActiveRecord(
      currentLedger.id,
      transactionRecordId,
    ),
  ]);
  if (!record) return null;

  const canModify = canModifyTransaction({
    createdBy: record.created_by ?? null,
    role: currentLedger.currentUserRole,
    userId: dependencies.currentUserId,
  });
  const items = await dependencies.transactionRepository.listItems(
    currentLedger.id,
    [transactionRecordId],
  );
  const hasProtectedLinkedItem = items.some(
    (item) =>
      item.special_status === "reimbursed" ||
      (item.settled_by_item_id !== null &&
        item.settled_by_item_id !== undefined) ||
      (item.has_refund_link && !item.is_refund_income),
  );
  const canEdit = canModify && !hasProtectedLinkedItem;
  const editRestriction = !canModify
    ? "permission"
    : hasProtectedLinkedItem
      ? "linked"
      : null;

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
      editRestriction,
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
      reimbursementCandidates: [],
    };
  }

  if (record.type !== "normal" || items.length === 0) return null;

  const specialStatusEnabled = Boolean(
    currentLedger.transactionItemSpecialStatusEnabled,
  );
  const incomeItemIds = items
    .filter(
      (item) => item.is_refund_income || item.is_reimbursement_income,
    )
    .map((item) => item.id);
  const incomeLinksPromise =
    incomeItemIds.length > 0 && dependencies.transactionIncomeLinkRepository
      ? dependencies.transactionIncomeLinkRepository.listByIncomeItemIds(
          currentLedger.id,
          incomeItemIds,
        )
      : Promise.resolve([]);
  const [pendingItems, incomeLinks] = await Promise.all([
    specialStatusEnabled
      ? dependencies.transactionRepository.listPendingReimbursementItems(
          currentLedger.id,
        )
      : Promise.resolve([]),
    incomeLinksPromise,
  ]);
  const incomeLinkByItemId = new Map(
    incomeLinks.map((link) => [link.incomeItemId, link]),
  );
  const linkedReimbursementItems = incomeLinks.flatMap(
    (link) => link.reimbursementItems,
  );
  const reimbursementCandidates = deduplicateCandidates([
    ...buildReimbursementCandidates(
      pendingItems,
      options.accountOptions,
      options.categoryOptions,
      currentLedger.baseCurrency,
    ),
    ...buildLinkedReimbursementCandidates(
      linkedReimbursementItems,
      options.accountOptions,
      options.categoryOptions,
      currentLedger.baseCurrency,
    ),
  ]);

  return {
    ...options,
    canEdit,
    editRestriction,
    initialValues: {
      accountId: items[0]?.account_id ?? "",
      items: items.map((item) => {
        const incomeLink = incomeLinkByItemId.get(item.id);
        const refundCandidate = buildRefundCandidate(
          incomeLink,
          item,
          options.accountOptions,
          options.categoryOptions,
          currentLedger.baseCurrency,
        );

        return {
          amount: formatEditableAmount(item.amount),
          businessStatus: resolveTransactionBusinessStatus({
            isRefundIncome: item.is_refund_income,
            isReimbursementIncome: item.is_reimbursement_income,
            specialStatus: item.special_status ?? null,
          }),
          categoryId: item.category_id ?? "",
          id: item.id,
          refundCandidate,
          refundedAmount: item.refunded_amount ?? "0",
          refundedItemId: refundCandidate?.id ?? null,
          reimbursementItemIds:
            incomeLink?.reimbursementItems.map((linkedItem) => linkedItem.id) ??
            [],
          specialStatus: fromTransactionSpecialStatusStorageValue(
            item.special_status ?? null,
          ),
        };
      }),
      merchantId: record.merchant_id ?? "",
      note: record.note ?? "",
      transactionAt: record.transaction_at,
      transactionRecordId: record.id,
      type: resolveNormalTransactionDisplayType(items, options.categoryOptions),
    },
    ledgerName: currentLedger.name,
    reimbursementCandidates,
  };
}

function buildReimbursementCandidates(
  items: Awaited<
    ReturnType<TransactionFormRepository["listPendingReimbursementItems"]>
  >,
  accounts: TransactionAccountOption[],
  categories: TransactionCategoryOption[],
  fallbackCurrency: string,
) {
  const accountById = new Map(accounts.map((account) => [account.id, account]));
  const categoryById = new Map(
    categories.map((category) => [category.id, category]),
  );
  return items.map((item) => ({
    accountCurrency:
      accountById.get(item.account_id)?.currency ?? fallbackCurrency,
    amount: item.amount,
    categoryName: categoryById.get(item.category_id)?.name ?? "未知分类",
    id: item.id,
    transactionAt: item.transaction_at,
  }));
}

function buildLinkedReimbursementCandidates(
  items: TransactionIncomeLinkedItem[],
  accounts: TransactionAccountOption[],
  categories: TransactionCategoryOption[],
  fallbackCurrency: string,
) {
  const accountById = new Map(accounts.map((account) => [account.id, account]));
  const categoryById = new Map(
    categories.map((category) => [category.id, category]),
  );

  return items.map((item) => ({
    accountCurrency:
      accountById.get(item.accountId)?.currency ?? fallbackCurrency,
    amount: item.amount,
    categoryName: categoryById.get(item.categoryId)?.name ?? "未知分类",
    id: item.id,
    transactionAt: item.transactionAt,
  }));
}

function deduplicateCandidates<T extends { id: string }>(items: T[]): T[] {
  return [...new Map(items.map((item) => [item.id, item])).values()];
}

function buildRefundCandidate(
  incomeLink: TransactionIncomeLinkData | undefined,
  incomeItem: TransactionItemDbRow,
  accounts: TransactionAccountOption[],
  categories: TransactionCategoryOption[],
  fallbackCurrency: string,
) {
  const refundedItem = incomeLink?.refundedItem;
  if (!refundedItem) return null;

  const account = accounts.find(
    (option) => option.id === refundedItem.accountId,
  );
  const category = categories.find(
    (option) => option.id === refundedItem.categoryId,
  );
  const refundedAmount = Number(refundedItem.refundedAmount);
  const incomeAmount = Number(incomeItem.amount);
  const originalAmount = Number(refundedItem.amount);
  const remainingRefundableAmount = Math.max(
    0,
    originalAmount - refundedAmount + incomeAmount,
  );

  return {
    accountCurrency: account?.currency ?? fallbackCurrency,
    accountId: refundedItem.accountId,
    amount: refundedItem.amount,
    categoryName: category?.name ?? "未知分类",
    id: refundedItem.id,
    parentCategoryName: category?.parentName ?? null,
    refundedAmount: refundedItem.refundedAmount,
    remainingRefundableAmount: String(remainingRefundableAmount),
    transactionAt: refundedItem.transactionAt,
    transactionRecordId: refundedItem.transactionRecordId,
  };
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
