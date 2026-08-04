import type { CategoryType } from "internal/category";
import type {
  TransactionBusinessStatus,
  TransactionRecordStorageType,
  TransactionReimbursementCandidate,
  TransactionSpecialStatusFilterValue,
  TransactionType,
} from "internal/transaction";
import type { ThemeColorKey } from "theme/themeColorTokens";
import type { BaseActionState } from "types/auth";

export type TransactionActionState = BaseActionState;

export type TransactionStateAction = (
  previousState: TransactionActionState,
  formData: FormData,
) => Promise<TransactionActionState>;

export const transactionTypeOptions = [
  { label: "支出", value: "expense" },
  { label: "收入", value: "income" },
] as const;

export type { TransactionBusinessStatus };
export type { TransactionRecordStorageType, TransactionType };
export type TransactionRecordType = TransactionType | "transfer";
// 分类类型目前只对应支出 / 收入，用语义别名和包含 transfer 的展示类型区分。
export type TransactionCategoryType = CategoryType;

export type TransactionGroupBy =
  | "year"
  | "quarter"
  | "month"
  | "week"
  | "day"
  | "merchant"
  | "account"
  | "parentCategory"
  | "category"
  | "member"
  | "specialStatus";

export type TransactionFilterRecordType =
  | "all"
  | "income"
  | "expense"
  | "refundableExpense"
  | "transfer";

export type TransactionFilters = {
  accountId?: string;
  categoryId?: string;
  dateFrom?: string;
  dateTo?: string;
  memberId?: string;
  merchantId?: string;
  parentCategoryId?: string;
  recordType: TransactionFilterRecordType;
  specialStatuses?: TransactionSpecialStatusFilterValue[];
};

export const defaultTransactionFilters = {
  recordType: "all",
} satisfies TransactionFilters;

export type CategorySummaryItem = {
  accountId?: string;
  amount: string;
  businessStatus?: TransactionBusinessStatus | null;
  categoryName: string;
  categoryType?: TransactionCategoryType;
  id?: string;
  parentCategoryName: string | null;
  refundedAmount?: string;
  remainingRefundableAmount?: string;
};

export type TransactionRowItem = {
  id: string;
  type: TransactionRecordType;
  transaction_at: string;
  amount: string;
  account_name: string;
  account_currency: string;
  account_color?: ThemeColorKey | null;
  canEdit?: boolean;
  categoryItems: CategorySummaryItem[];
  merchant_name: string | null;
  merchant_icon_url: string | null;
  note?: string | null;
  recorder_color?: ThemeColorKey | null;
  recorder_name?: string | null;
  show_recorder?: boolean;
};

export type TransactionAccountOption = {
  id: string;
  name: string;
  currency: string;
};

export type TransactionCategoryOption = {
  id: string;
  name: string;
  parentId: string | null;
  parentName: string | null;
  type: TransactionCategoryType;
};

export type TransactionMerchantOption = {
  id: string;
  name: string;
  icon_url: string | null;
};

export type TransactionMemberOption = {
  id: string;
  name: string;
};

export type TransactionFilterOptions = {
  accounts: TransactionAccountOption[];
  categories: TransactionCategoryOption[];
  members: TransactionMemberOption[];
  merchants: TransactionMerchantOption[];
  transactionItemSpecialStatusEnabled?: boolean;
};

export type { TransactionSpecialStatusFilterValue };
export type { TransactionReimbursementCandidate };

export type TransactionListItem = TransactionRowItem & {
  note: string | null;
  recorder_name: string | null;
  created_at: string;
};

export type TransactionRefundCandidate = {
  accountCurrency: string;
  accountId: string;
  amount: string;
  categoryName: string;
  id: string;
  parentCategoryName: string | null;
  refundedAmount: string;
  remainingRefundableAmount: string;
  transactionAt: string;
  transactionRecordId: string;
};

export type TransactionAmountSummary = {
  income: string;
  expense: string;
  balance: string;
  currency: string;
};

export type TransactionDateGroup = {
  date: string;
  label: string;
  summary: TransactionAmountSummary;
  items: TransactionListItem[];
};

export type TransactionMonthViewData = {
  month: string;
  monthLabel: string;
  previousMonth: string;
  nextMonth: string;
  groups: TransactionDateGroup[];
  nextOffset: number | null;
};

export type TransactionMonthView = TransactionMonthViewData;

export type TransactionMonthPage = {
  groups: TransactionDateGroup[];
  nextOffset: number | null;
};

export type TransactionListPage = {
  items: TransactionListItem[];
  nextOffset: number | null;
};

export type TransactionSearchPage = TransactionListPage & {
  totalCount: number;
};

export type TransactionGroupSummaryItem = {
  id: string;
  key: string;
  label: string;
  summary: TransactionAmountSummary;
  transactionCount: number;
};

export type TransactionGroupPage = {
  groupBy: TransactionGroupBy;
  groups: TransactionGroupSummaryItem[];
  nextOffset: number | null;
};

export type TransactionTimeGroupViewData = {
  groupBy: TransactionGroupBy;
  groups: TransactionGroupSummaryItem[];
  initialDateGroupsByGroupId: Record<string, TransactionDateGroup[]>;
  initialExpandedGroupId: string | null;
  initialNextItemOffsetByGroupId: Record<string, number | null>;
  nextOffset: number | null;
};

export type TransferEditInitialValues = {
  accountId: string;
  note: string;
  transactionAt: string;
  transactionRecordId: string;
  transferAmount: string;
  transferTargetAccountId: string;
  type: "transfer";
};
