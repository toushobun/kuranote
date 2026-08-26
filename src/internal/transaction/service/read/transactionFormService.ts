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
import {
  formatRefundMinorUnits,
  toRefundMinorUnits,
} from "internal/transaction/util/refundAllocation";
import { hasBusinessNetAmountOffset } from "utils/transactions";

type TransactionFormReadDependencies =
  TransactionReadDependencies<TransactionFormRepository> & {
    transactionIncomeLinkRepository?: TransactionIncomeLinkRepository;
  };

export function areAccountIdsAvailable(
  accountIds: readonly string[],
  accountOptions: readonly { id: string }[],
): boolean {
  const availableAccountIds = new Set(
    accountOptions.map((account) => account.id),
  );
  return accountIds.every((accountId) => availableAccountIds.has(accountId));
}

export async function getNewTransactionView(
  dependencies: TransactionReadDependencies<TransactionFormRepository>,
  currentLedger: CurrentLedger,
): Promise<NewTransactionView> {
  const options = await loadTransactionFormOptions(dependencies, currentLedger);
  return {
    ...options,
    canWriteTransactions: canWriteTransaction(currentLedger.currentUserRole),
    ledgerName: currentLedger.name,
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
  const canEdit = canModify;
  const editRestriction = canModify ? null : "permission";

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
    const hasArchivedAccount = !areAccountIdsAvailable(
      [fromItem.account_id, toItem.account_id],
      options.accountOptions,
    );
    const transferEditRestriction = canModify
      ? hasArchivedAccount
        ? "archivedAccount"
        : null
      : "permission";

    return {
      ...options,
      canEdit: canModify && !hasArchivedAccount,
      editRestriction: transferEditRestriction,
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
    };
  }

  if (record.type !== "normal" || items.length === 0) return null;

  const incomeItemIds = items.flatMap((item) =>
    item.id && (item.is_refund_income || item.is_reimbursement_income)
      ? [item.id]
      : [],
  );
  const incomeLinksPromise =
    incomeItemIds.length > 0 && dependencies.transactionIncomeLinkRepository
      ? dependencies.transactionIncomeLinkRepository.listByIncomeItemIds(
          currentLedger.id,
          incomeItemIds,
        )
      : Promise.resolve([]);
  const incomeLinks = await incomeLinksPromise;
  const incomeLinkByItemId = new Map(
    incomeLinks.map((link) => [link.incomeItemId, link]),
  );

  return {
    ...options,
    canEdit,
    editRestriction,
    initialValues: {
      accountId: items[0]?.account_id ?? "",
      items: items.map((item) => {
        const incomeLink = item.id
          ? incomeLinkByItemId.get(item.id)
          : undefined;
        const refundCandidate = buildRefundCandidate(
          incomeLink,
          options.accountOptions,
          options.categoryOptions,
          currentLedger.baseCurrency,
        );
        const reimbursementCandidate = buildReimbursementCandidate(
          incomeLink,
          options.accountOptions,
          options.categoryOptions,
          currentLedger.baseCurrency,
        );
        const amount = formatEditableAmount(item.amount);
        const businessNetAmount = hasBusinessNetAmountOffset(
          item.amount,
          item.business_net_amount,
        )
          ? formatEditableAmount(item.business_net_amount)
          : undefined;

        return {
          amount,
          ...(businessNetAmount === undefined ? {} : { businessNetAmount }),
          businessStatus: resolveTransactionBusinessStatus({
            isRefundIncome: item.is_refund_income,
            isReimbursementIncome: item.is_reimbursement_income,
            refundedAmount: item.refunded_amount,
            reimbursementAmount: item.reimbursement_amount,
            specialStatus: item.special_status ?? null,
          }),
          categoryId: item.category_id ?? "",
          expectedUpdatedAt: item.updated_at,
          id: item.id,
          refundCandidate,
          reimbursementCandidate,
          refundedAmount: item.refunded_amount ?? "0",
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
  };
}

function buildRefundCandidate(
  incomeLink: TransactionIncomeLinkData | undefined,
  accounts: TransactionAccountOption[],
  categories: TransactionCategoryOption[],
  fallbackCurrency: string,
) {
  const refundItem = incomeLink?.refundItem;
  if (!refundItem) return null;

  return buildIncomeLinkCandidate(
    refundItem,
    refundItem.refundLinkAmount,
    accounts,
    categories,
    fallbackCurrency,
  );
}

function buildReimbursementCandidate(
  incomeLink: TransactionIncomeLinkData | undefined,
  accounts: TransactionAccountOption[],
  categories: TransactionCategoryOption[],
  fallbackCurrency: string,
) {
  const reimbursementItem = incomeLink?.reimbursementItems[0];
  if (!reimbursementItem) return null;

  return buildIncomeLinkCandidate(
    reimbursementItem,
    reimbursementItem.reimbursementLinkAmount,
    accounts,
    categories,
    fallbackCurrency,
  );
}

function buildIncomeLinkCandidate(
  linkedItem: TransactionIncomeLinkedItem,
  currentAllocationAmount: string,
  accounts: TransactionAccountOption[],
  categories: TransactionCategoryOption[],
  fallbackCurrency: string,
) {
  const account = accounts.find((option) => option.id === linkedItem.accountId);
  const category = categories.find(
    (option) => option.id === linkedItem.categoryId,
  );
  const originalAmountUnits = toRefundMinorUnits(linkedItem.amount);
  const refundedAmountUnits = toRefundMinorUnits(linkedItem.refundedAmount);
  const reimbursementAmountUnits = toRefundMinorUnits(
    linkedItem.reimbursementAmount,
  );
  const currentAllocationUnits = toRefundMinorUnits(currentAllocationAmount);
  const calculatedRemainingUnits =
    originalAmountUnits !== null &&
    refundedAmountUnits !== null &&
    reimbursementAmountUnits !== null &&
    currentAllocationUnits !== null
      ? originalAmountUnits -
        refundedAmountUnits -
        reimbursementAmountUnits +
        currentAllocationUnits
      : BigInt(0);
  const remainingRefundableAmount = formatRefundMinorUnits(
    calculatedRemainingUnits,
  );

  return {
    accountCurrency: account?.currency ?? fallbackCurrency,
    accountId: linkedItem.accountId,
    amount: linkedItem.amount,
    categoryName: category?.name ?? "未知分类",
    id: linkedItem.id,
    parentCategoryName: category?.parentName ?? null,
    refundedAmount: linkedItem.refundedAmount,
    remainingRefundableAmount,
    transactionAt: linkedItem.transactionAt,
    transactionRecordId: linkedItem.transactionRecordId,
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
