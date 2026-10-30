import type { CurrentLedger } from "internal/ledger";
import { canModifyTransaction, canWriteTransaction } from "internal/ledger";
import type { TransactionItemDbRow } from "internal/db-types";
import type {
  TransactionIncomeLinkData,
  TransactionIncomeLinkedItem,
  TransactionIncomeLinkRepository,
} from "internal/transaction/repository/transactionIncomeLinkRepository";
import type { TransactionFormRepository } from "internal/transaction/repository/transactionRepository";
import {
  loadTransactionEntryOptions,
  loadTransactionFormOptions,
} from "internal/transaction/service/read/options";
import type { TransactionReadDependencies } from "internal/transaction/service/read/transactionContext";
import type {
  EditTransactionEntryView,
  EditTransactionView,
  NewTransactionView,
  TransactionAccountOption,
  TransactionCategoryOption,
  TransactionFormOptions,
  TransferEditInitialValues,
} from "internal/transaction/service/read/transactionReadModels";
import type { TransactionEditRestriction } from "internal/transaction/entity/transactionReadModels";
import type { TransactionType } from "internal/transaction/entity/transactionType";
import {
  fromTransactionSpecialStatusStorageValue,
  resolveTransactionBusinessStatus,
} from "internal/transaction/entity/transactionSpecialStatus";
import {
  formatRefundMinorUnits,
  toRefundMinorUnits,
} from "internal/transaction/util/refundAllocation";
import { transactionFallbackLabels } from "internal/transaction/util/transactionFallbackLabels";
import { requireItemAccountId } from "internal/transaction/util/grouping/recordAccounts";
import { hasBusinessNetAmountOffset } from "utils/transactions";
import { getAmountDecimalPlaces } from "utils/transactionAmountInput";

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
  const options = await loadTransactionEntryOptions(
    dependencies,
    currentLedger,
  );
  return {
    ...options,
    canWriteTransactions: canWriteTransaction(currentLedger.currentUserRole),
    ledgerId: currentLedger.id,
    ledgerName: currentLedger.name,
  };
}

export function getEditTransactionView(
  dependencies: TransactionFormReadDependencies,
  currentLedger: CurrentLedger,
  transactionRecordId: string,
): Promise<EditTransactionView | null> {
  return buildEditTransactionView(
    dependencies,
    currentLedger,
    transactionRecordId,
    loadTransactionFormOptions,
  );
}

/** 编辑记账页（#962）：小票的选择商家 / 账户与新增记账使用相同的选项。 */
export async function getEditTransactionEntryView(
  dependencies: TransactionFormReadDependencies,
  currentLedger: CurrentLedger,
  transactionRecordId: string,
): Promise<EditTransactionEntryView | null> {
  const view = await buildEditTransactionView(
    dependencies,
    currentLedger,
    transactionRecordId,
    loadTransactionEntryOptions,
  );
  return view && { ...view, ledgerId: currentLedger.id };
}

async function buildEditTransactionView<
  Options extends Pick<
    TransactionFormOptions,
    "accountOptions" | "categoryOptions"
  >,
>(
  dependencies: TransactionFormReadDependencies,
  currentLedger: CurrentLedger,
  transactionRecordId: string,
  loadOptions: (
    dependencies: TransactionFormReadDependencies,
    currentLedger: CurrentLedger,
  ) => Promise<Options>,
): Promise<EditTransactionView<Options> | null> {
  const [options, record] = await Promise.all([
    loadOptions(dependencies, currentLedger),
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
  const [items, payments] = await Promise.all([
    dependencies.transactionRepository.listItems(currentLedger.id, [
      transactionRecordId,
    ]),
    dependencies.transactionRepository.listPayments(currentLedger.id, [
      transactionRecordId,
    ]),
  ]);
  // 普通记录的付款账户来自 transaction_payment；转账 / 余额调整仍看明细账户。
  const recordAccountIds =
    record.type === "normal"
      ? payments.map((payment) => payment.account_id)
      : items.map(requireItemAccountId);
  const hasArchivedAccount = !areAccountIdsAvailable(
    recordAccountIds,
    options.accountOptions,
  );
  // 已归档账户不在选项里；转账与普通记录另外读取，只读时仍按记录实际币种与名称显示（#962、#966）。
  const archivedAccountOptions =
    hasArchivedAccount && record.type !== "balance_adjustment"
      ? await loadArchivedAccountOptions(
          dependencies,
          currentLedger,
          recordAccountIds,
          options.accountOptions,
        )
      : [];
  const currencyByAccountId = new Map(
    [...options.accountOptions, ...archivedAccountOptions].map((account) => [
      account.id,
      account.currency,
    ]),
  );
  // 有限制时编辑页显示只读详情（#928）；删除仍按修改权限判断。
  const editRestriction: TransactionEditRestriction | null = !canModify
    ? "permission"
    : hasArchivedAccount
      ? "archivedAccount"
      : null;

  if (record.type === "balance_adjustment") {
    const item = items[0];
    if (
      items.length !== 1 ||
      !item ||
      !Number.isFinite(Number(item.balance_delta)) ||
      Number(item.balance_delta) === 0
    )
      return null;
    const accountId = requireItemAccountId(item);
    const context =
      await dependencies.accountQueryService.getTransactionContext({
        accountIds: [accountId],
        ledgerId: currentLedger.id,
        userId: dependencies.currentUserId,
      });
    const account = context.accounts.find(
      (account) => account.id === accountId,
    );
    return {
      ...options,
      canDelete: canModify,
      // 余额调整的账户已归档时仍可修改时间与备注（只禁止删除），因此只按权限限制。
      editRestriction: canModify ? null : "permission",
      initialValues: {
        type: "balance_adjustment",
        accountId,
        accountName: account?.name ?? transactionFallbackLabels.account,
        currency: account?.currency ?? currentLedger.baseCurrency,
        signedDelta: item.balance_delta!,
        transactionAt: record.transaction_at,
        transactionRecordId: record.id,
        note: record.note ?? "",
        accountArchived: hasArchivedAccount,
      },
      ledgerName: currentLedger.name,
    };
  }
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
    const fromAccountId = requireItemAccountId(fromItem);
    return {
      ...options,
      archivedAccountOptions,
      canDelete: canModify,
      editRestriction,
      initialValues: {
        accountId: fromAccountId,
        note: record.note ?? "",
        transactionAt: record.transaction_at,
        transactionRecordId: record.id,
        transferAmount: formatEditableAmount(
          fromItem.amount,
          currencyByAccountId.get(fromAccountId) ?? currentLedger.baseCurrency,
        ),
        transferTargetAccountId: requireItemAccountId(toItem),
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

  // 记录币种取首个付款账户的币种（各付款账户币种一致），不读明细的账户镜像。
  const currency =
    currencyByAccountId.get(payments[0]?.account_id ?? "") ??
    currentLedger.baseCurrency;

  return {
    ...options,
    archivedAccountOptions,
    canDelete: canModify,
    editRestriction,
    initialValues: {
      ...(record.updated_at
        ? { expectedRecordUpdatedAt: record.updated_at }
        : {}),
      payments: payments.map((payment) => ({
        accountId: payment.account_id,
        amount: formatEditableAmount(payment.amount, currency),
      })),
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
        const amount = formatEditableAmount(item.amount, currency);
        const businessNetAmount = hasBusinessNetAmountOffset(
          item.amount,
          item.business_net_amount,
        )
          ? formatEditableAmount(item.business_net_amount, currency)
          : undefined;

        return {
          amount,
          ...(businessNetAmount === undefined ? {} : { businessNetAmount }),
          businessStatus: resolveTransactionBusinessStatus({
            currency,
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
          reimbursementAmount: item.reimbursement_amount ?? "0",
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

async function loadArchivedAccountOptions(
  dependencies: TransactionFormReadDependencies,
  currentLedger: CurrentLedger,
  accountIds: readonly string[],
  accountOptions: readonly { id: string }[],
): Promise<TransactionAccountOption[]> {
  const availableAccountIds = new Set(
    accountOptions.map((account) => account.id),
  );
  const missingAccountIds = [
    ...new Set(accountIds.filter((id) => !availableAccountIds.has(id))),
  ];
  const context = await dependencies.accountQueryService.getTransactionContext({
    accountIds: missingAccountIds,
    ledgerId: currentLedger.id,
    userId: dependencies.currentUserId,
  });
  return context.accounts.map(({ currency, id, name }) => ({
    currency,
    id,
    name,
  }));
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
    categoryName: category?.name ?? transactionFallbackLabels.category,
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

export function formatEditableAmount(amount: string, currency?: string) {
  const value = Number(amount);
  if (!Number.isFinite(value)) return amount;
  return String(Number(value.toFixed(getAmountDecimalPlaces(currency))));
}
