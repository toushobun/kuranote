import type { AccountExportQueryService } from "internal/account";
import type { CategoryQueryService } from "internal/category";
import type { MerchantExportQueryService } from "internal/merchant";
import type { TransactionExportQueryService } from "internal/transaction";
import type { DataExport } from "internal/dataExport/entity/dataExport";

export interface DataExportService {
  getData(input: {
    ledgerId: string;
    userId: string;
    includePhotos?: boolean;
    dateStart?: string;
    dateEnd?: string;
    recordTypes?: Parameters<TransactionExportQueryService["listAllForExport"]>[0]["recordTypes"];
  }): Promise<DataExport>;
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
      const data = { records, accounts, categories, merchants };
      if (!input.includePhotos) return data;
      const photos = await transactionQueryService.listPhotosForExport({
        ledgerId: input.ledgerId,
        userId: input.userId,
        recordIds: records
          .filter((record) => record.type === "normal")
          .map((record) => record.id),
      });
      return photos.length > 0 ? { ...data, photos } : data;
    },
  };
}
