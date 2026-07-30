import type { CurrentLedger } from "internal/ledger";
import type { CategorySummaryDbRow } from "internal/db-types";
import type { TransactionFormOptions } from "internal/transaction/entity/transactionFormOptions";
import type { TransactionReadDependencies } from "internal/transaction/service/read/transactionContext";
import type {
  TransactionCategoryOption,
  TransactionFilterOptions,
  TransactionMemberOption,
} from "types/transactions";

export async function loadTransactionFormOptions(
  dependencies: TransactionReadDependencies,
  currentLedger: CurrentLedger,
): Promise<TransactionFormOptions> {
  const [accountOptions, categoryRows, merchantOptions, tagOptions] =
    await Promise.all([
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
      dependencies.transactionRepository.listActiveTags(currentLedger.id),
    ]);

  return {
    accountOptions,
    categoryOptions: buildFormCategoryOptions(categoryRows),
    merchantOptions,
    tagOptions,
  };
}

export async function loadTransactionFilterOptions(
  dependencies: TransactionReadDependencies,
  currentLedger: CurrentLedger,
): Promise<TransactionFilterOptions> {
  const [accounts, categoryRows, merchants, tags, memberIds] =
    await Promise.all([
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
      dependencies.transactionRepository.listActiveTags(currentLedger.id),
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
    tags,
  };
}

async function loadMemberOptions(
  dependencies: TransactionReadDependencies,
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
  const parentNameById = new Map(
    rows
      .filter((row) => row.parent_id === null)
      .map((row) => [row.id, row.name]),
  );
  return rows
    .filter((row) => row.parent_id !== null)
    .map((row) => ({
      id: row.id,
      name: row.name,
      parentId: row.parent_id,
      parentName: parentNameById.get(row.parent_id as string) ?? null,
      type: row.type,
    }));
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
