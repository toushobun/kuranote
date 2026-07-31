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
