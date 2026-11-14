import type { CurrentLedger } from "internal/ledger";
import type {
  FilteredTransactionPageInput,
  FilteredTransactionPageResult,
  TransactionContextRepository,
} from "internal/transaction/repository/transactionRepository";
import {
  buildFilteredTransactionListItems,
  loadTransactionGroupLoaderContextForRecords,
  type TransactionReadDependencies,
} from "internal/transaction/service/read/transactionContext";
import type { TransactionListItem } from "internal/transaction/service/read/transactionReadModels";
import type { TransactionFilters } from "internal/transaction/entity/transactionGrouping";

export type FilteredPageTimingStage =
  | "pageRpc"
  | "records"
  | "itemsPayments"
  | "contextLookups"
  | "buildListItems";

/** 候选与后续记账搜索共用：数据库先排序分页，只装载本页记录与关联数据。 */
export async function loadFilteredTransactionPage(
  dependencies: TransactionReadDependencies<TransactionContextRepository>,
  ledger: CurrentLedger,
  input: Omit<FilteredTransactionPageInput, "ledgerId">,
  filters: TransactionFilters,
  onTiming?: (stage: FilteredPageTimingStage, elapsedMs: number) => void,
): Promise<FilteredTransactionPageResult & { items: TransactionListItem[] }> {
  const pageStartedAt = performance.now();
  const page = await dependencies.transactionRepository.loadFilteredPage({
    ...input,
    ledgerId: ledger.id,
  });
  onTiming?.("pageRpc", performance.now() - pageStartedAt);
  const recordIds = [...new Set(page.entries.map((entry) => entry.recordId))];
  if (recordIds.length === 0) return { ...page, items: [] };

  const recordsStartedAt = performance.now();
  const records = await dependencies.transactionRepository.listRecords({
    ledgerId: ledger.id,
    recordIds,
    recordType: "all",
  });
  onTiming?.("records", performance.now() - recordsStartedAt);
  const context = await loadTransactionGroupLoaderContextForRecords(
    dependencies,
    ledger,
    records,
    onTiming,
  );
  const buildStartedAt = performance.now();
  const itemsByRecordId = new Map(
    buildFilteredTransactionListItems(context, filters).map((item) => [
      item.id,
      item,
    ]),
  );
  const orderedItems = recordIds.flatMap((recordId) => {
    const item = itemsByRecordId.get(recordId);
    return item ? [item] : [];
  });
  onTiming?.("buildListItems", performance.now() - buildStartedAt);
  return { ...page, items: orderedItems };
}
