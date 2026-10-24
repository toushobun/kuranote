import type { TransactionGroupBy } from "internal/transaction/entity/transactionGrouping";
import type {
  TransactionDateGroup,
  TransactionGroupSummaryItem,
  TransactionListItem,
} from "internal/transaction/service/read/transactionReadModels";

export type TransactionMonthPage = {
  groups: TransactionDateGroup[];
  nextOffset: number | null;
};

export type TransactionSearchPage = {
  items: TransactionListItem[];
  nextOffset: number | null;
  totalCount: number;
};

export type TransactionGroupPage = {
  groupBy: TransactionGroupBy;
  groups: TransactionGroupSummaryItem[];
  nextOffset: number | null;
};

/** 编辑页的限制原因；有限制时显示只读详情（#928）。 */
export type TransactionEditRestriction =
  | "archivedAccount"
  | "linked"
  | "permission";
