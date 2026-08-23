import type { CategoryType } from "internal/category";
import type { MerchantSummary } from "internal/merchant";
import type { TransactionGroupBy } from "internal/transaction/entity/transactionGrouping";
import type { TransactionType } from "internal/transaction/entity/transactionType";
import type {
  TransactionBusinessStatus,
  TransactionSpecialStatus,
} from "internal/transaction/entity/transactionSpecialStatus";
import type { ThemeColorKey } from "theme/themeColorTokens";

export type TransactionCategorySummaryItem = {
  accountId?: string;
  amount: string;
  businessStatus?: TransactionBusinessStatus | null;
  categoryName: string;
  categoryType?: CategoryType;
  id?: string;
  parentCategoryName: string | null;
  refundedAmount?: string;
  remainingRefundableAmount?: string;
};

export type TransactionListItem = {
  account_color?: ThemeColorKey | null;
  account_currency: string;
  account_name: string;
  amount: string;
  originalAmount?: string;
  originalType?: CategoryType;
  canEdit?: boolean;
  categoryItems: TransactionCategorySummaryItem[];
  created_at: string;
  id: string;
  merchant_icon_url: string | null;
  merchant_name: string | null;
  note: string | null;
  recorder_color?: ThemeColorKey | null;
  recorder_name: string | null;
  show_recorder?: boolean;
  transaction_at: string;
  type: TransactionType | "transfer";
};

export type TransactionAccountOption = {
  currency: string;
  id: string;
  name: string;
};

export type TransactionCategoryOption = {
  id: string;
  name: string;
  parentId: string | null;
  parentName: string | null;
  type: CategoryType;
};

export type TransactionMemberOption = {
  id: string;
  name: string;
};

export type TransactionFilterOptions = {
  accounts: TransactionAccountOption[];
  categories: TransactionCategoryOption[];
  members: TransactionMemberOption[];
  merchants: MerchantSummary[];
  transactionItemSpecialStatusEnabled?: boolean;
};

export type TransactionFormOptions = {
  accountOptions: TransactionAccountOption[];
  categoryOptions: TransactionCategoryOption[];
  frequentCategoryIds: string[];
  merchantOptions: MerchantSummary[];
  transactionItemSpecialStatusEnabled: boolean;
};

export type TransactionAmountSummary = {
  balance: string;
  currency: string;
  expense: string;
  income: string;
};

export type TransactionDateGroup = {
  date: string;
  items: TransactionListItem[];
  label: string;
  summary: TransactionAmountSummary;
};

export type TransactionGroupSummaryItem = {
  id: string;
  key: string;
  label: string;
  summary: TransactionAmountSummary;
  transactionCount: number;
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

type TransactionIncomeLinkCandidate = {
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

export type NewTransactionView = TransactionFormOptions & {
  canWriteTransactions: boolean;
  ledgerName: string;
};

export type EditTransactionView = TransactionFormOptions & {
  canEdit: boolean;
  editRestriction: "linked" | "permission" | null;
  initialValues:
    | TransferEditInitialValues
    | {
        accountId: string;
        items: {
          amount: string;
          businessNetAmount?: string;
          businessStatus?: TransactionBusinessStatus | null;
          categoryId: string;
          expectedUpdatedAt?: string;
          id?: string;
          refundCandidate?: TransactionIncomeLinkCandidate | null;
          reimbursementCandidate?: TransactionIncomeLinkCandidate | null;
          refundedAmount?: string;
          specialStatus: TransactionSpecialStatus | null;
        }[];
        merchantId: string;
        note: string;
        transactionAt: string;
        transactionRecordId: string;
        type: TransactionType;
      };
  ledgerName: string;
};
