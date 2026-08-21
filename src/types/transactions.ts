import type { CategoryType } from "internal/category";
import type {
  TransactionBusinessStatus,
  TransactionRecordStorageType,
  TransactionSpecialStatusFilterValue,
  TransactionType,
} from "internal/transaction";
import type { ThemeColorKey } from "theme/themeColorTokens";
import type { BaseActionState } from "types/auth";

export type TransactionActionState = BaseActionState & {
  errorKey?: string;
};

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
  originalAmount?: string;
  originalType?: TransactionCategoryType;
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
