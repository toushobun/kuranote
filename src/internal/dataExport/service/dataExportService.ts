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
      // 普通记录的账户在付款明细上（#834 子 Issue 3），不在 items 上。
      const accountIds = records.flatMap((record) =>
        record.type === "normal"
          ? record.payments.map((payment) => payment.accountId)
          : record.items.map((item) => item.accountId),
      );
      const [accounts, categories, merchants] = await Promise.all([
        accountIds.length > 0
          ? accountQueryService.findExportSummaries({
              ...input,
              accountIds: [...new Set(accountIds)],
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
