import type { AccountExportQueryService } from "internal/account";
import type { CategoryQueryService } from "internal/category";
import type { MerchantExportQueryService } from "internal/merchant";
import type { TransactionExportQueryService } from "internal/transaction";
import type { DataExport } from "internal/dataExport/entity/dataExport";

export interface DataExportService {
  getData(input: { ledgerId: string; userId: string }): Promise<DataExport>;
}

async function loadReferences<T>(
  ids: string[],
  load: (ids: string[]) => Promise<T[]>,
): Promise<T[]> {
  const uniqueIds = [...new Set(ids)];
  const result: T[] = [];
  for (let offset = 0; offset < uniqueIds.length; offset += 100) {
    result.push(...(await load(uniqueIds.slice(offset, offset + 100))));
  }
  return result;
}

export function createDataExportService({
  accountQueryService,
  categoryQueryService,
  merchantQueryService,
  transactionQueryService,
}: {
  accountQueryService: AccountExportQueryService;
  categoryQueryService: CategoryQueryService;
  merchantQueryService: MerchantExportQueryService;
  transactionQueryService: TransactionExportQueryService;
}): DataExportService {
  return {
    async getData(input) {
      const records = await transactionQueryService.listAllForExport(input);
      const items = records.flatMap((record) => record.items);
      const [accounts, categories, merchants] = await Promise.all([
        items.length > 0
          ? accountQueryService.findExportSummaries({
              ...input,
              accountIds: [...new Set(items.map((item) => item.accountId))],
            })
          : Promise.resolve([]),
        loadReferences(
          items.flatMap((item) => (item.categoryId ? [item.categoryId] : [])),
          (categoryIds) =>
            categoryQueryService.findSummariesByIds({ ...input, categoryIds }),
        ),
        loadReferences(
          records.flatMap((record) =>
            record.merchantId ? [record.merchantId] : [],
          ),
          (merchantIds) =>
            merchantQueryService.findExportSummaries({ ...input, merchantIds }),
        ),
      ]);
      return { records, accounts, categories, merchants };
    },
  };
}
