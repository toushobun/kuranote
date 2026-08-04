import type { CurrentLedger } from "internal/ledger";
import type { CategorySummaryDbRow } from "internal/db-types";
import type {
  TransactionFilterOptionsRepository,
  TransactionFormRepository,
} from "internal/transaction/repository/transactionRepository";
import type { TransactionReadDependencies } from "internal/transaction/service/read/transactionContext";
import type {
  TransactionCategoryOption,
  TransactionFilterOptions,
  TransactionFormOptions,
  TransactionMemberOption,
} from "internal/transaction/service/read/transactionReadModels";

export async function loadTransactionFormOptions(
  dependencies: TransactionReadDependencies<TransactionFormRepository>,
  currentLedger: CurrentLedger,
): Promise<TransactionFormOptions> {
  const [accountOptions, categoryRows, merchantOptions] = await Promise.all([
    dependencies.accountQueryService.listTransactionOptions({
      ledgerId: currentLedger.id,
      userId: dependencies.currentUserId,
    }),
    dependencies.categoryQueryService.listActiveSummaries({
      ledgerId: currentLedger.id,
      userId: dependencies.currentUserId,
    }),
    dependencies.merchantQueryService.listActiveOptions({
      ledgerId: currentLedger.id,
    }),
  ]);

  return {
    accountOptions,
    categoryOptions: buildFormCategoryOptions(categoryRows),
    merchantOptions,
    transactionItemSpecialStatusEnabled:
      currentLedger.transactionItemSpecialStatusEnabled ?? false,
  };
}

export async function loadTransactionFilterOptions(
  dependencies: TransactionReadDependencies<TransactionFilterOptionsRepository>,
  currentLedger: CurrentLedger,
): Promise<TransactionFilterOptions> {
  const [accounts, categoryRows, merchants, memberIds] = await Promise.all([
    dependencies.accountQueryService.listTransactionOptions({
      ledgerId: currentLedger.id,
      userId: dependencies.currentUserId,
    }),
    dependencies.categoryQueryService.listActiveSummaries({
      ledgerId: currentLedger.id,
      userId: dependencies.currentUserId,
    }),
    dependencies.merchantQueryService.listActiveOptions({
      ledgerId: currentLedger.id,
    }),
    dependencies.transactionRepository.listActiveMemberIds(currentLedger.id),
  ]);
  const members = await loadMemberOptions(
    dependencies,
    currentLedger.id,
    memberIds,
  );

  return {
    accounts,
    categories: buildFilterCategoryOptions(categoryRows),
    members,
    merchants,
    transactionItemSpecialStatusEnabled:
      currentLedger.transactionItemSpecialStatusEnabled ?? false,
  };
}

async function loadMemberOptions(
  dependencies: TransactionReadDependencies<TransactionFilterOptionsRepository>,
  ledgerId: string,
  memberUserIds: string[],
): Promise<TransactionMemberOption[]> {
  return (
    await dependencies.transactionRepository.findUserSummaries(
      ledgerId,
      memberUserIds,
    )
  )
    .map((member) => ({ id: member.id, name: member.display_name }))
    .sort((left, right) => left.name.localeCompare(right.name));
}

export function buildFormCategoryOptions(
  rows: CategorySummaryDbRow[],
): TransactionCategoryOption[] {
  const parentRows = rows.filter((row) => row.parent_id === null);
  const childRowsByParentId = new Map<string, CategorySummaryDbRow[]>();

  for (const row of rows) {
    if (row.parent_id === null) continue;

    const childRows = childRowsByParentId.get(row.parent_id);
    if (childRows) {
      childRows.push(row);
      continue;
    }

    childRowsByParentId.set(row.parent_id, [row]);
  }

  return parentRows.flatMap((parentRow) =>
    (childRowsByParentId.get(parentRow.id) ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      parentId: parentRow.id,
      parentName: parentRow.name,
      type: row.type,
    })),
  );
}

export function buildFilterCategoryOptions(
  rows: CategorySummaryDbRow[],
): TransactionCategoryOption[] {
  const parentNameById = new Map(
    rows
      .filter((row) => row.parent_id === null)
      .map((row) => [row.id, row.name]),
  );
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    parentId: row.parent_id,
    parentName: row.parent_id
      ? (parentNameById.get(row.parent_id) ?? null)
      : null,
    type: row.type,
  }));
}
