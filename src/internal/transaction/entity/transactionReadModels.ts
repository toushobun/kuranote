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

export type TransactionRefundCandidate = {
  accountCurrency: string;
  /** 原支出首个付款账户；旧候选可以缺省。 */
  accountId?: string;
  accountName?: string;
  merchantName?: string | null;
  merchantIconUrl?: string | null;
  reimbursementAmount?: string;
  amount: string;
  categoryName: string;
  id: string;
  parentCategoryName: string | null;
  refundedAmount: string;
  remainingRefundableAmount: string;
  transactionAt: string;
  transactionRecordId: string;
};

export type TransactionLinkCandidatePage = {
  items: TransactionRefundCandidate[];
  nextOffset: number | null;
};
