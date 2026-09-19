import type { AccountExportSummary } from "internal/account";
import type { CategoryQueryService } from "internal/category";
import type { MerchantExportSummary } from "internal/merchant";
import type { TransactionExportRecord } from "internal/transaction";

export type DataExport = {
  records: TransactionExportRecord[];
  accounts: AccountExportSummary[];
  categories: Awaited<ReturnType<CategoryQueryService["findSummariesByIds"]>>;
  merchants: MerchantExportSummary[];
};
