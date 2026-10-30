import type { BalanceAdjustmentEditInitialValues } from "internal/transaction/entity/balanceAdjustment";
import type { AccountType } from "internal/account";
import type { CategoryType } from "internal/category";
import type { MerchantEntryOptions, MerchantSummary } from "internal/merchant";
import type { TransactionPayment } from "internal/transaction/entity/transactionPayment";
import type { TransactionGroupBy } from "internal/transaction/entity/transactionGrouping";
import type { TransactionEditRestriction } from "internal/transaction/entity/transactionReadModels";
import type { TransactionType } from "internal/transaction/entity/transactionType";
import type {
  TransactionBusinessStatus,
  TransactionSpecialStatus,
} from "internal/transaction/entity/transactionSpecialStatus";
import type { ThemeColorKey } from "theme/themeColorTokens";

export type TransactionCategorySummaryItem = {
  amount: string;
  businessNetAmount?: string;
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
  categoryItems: TransactionCategorySummaryItem[];
  created_at: string;
  id: string;
  merchant_icon_url: string | null;
  merchant_name: string | null;
  note: string | null;
  /** 有账户筛选 ∧ 多账户记录时：整笔金额（付款明细 amount 合计），用于「共同支付」行。 */
  record_total_amount?: string;
  recorder_color?: ThemeColorKey | null;
  recorder_name: string | null;
  show_recorder?: boolean;
  transaction_at: string;
  type: TransactionType | "transfer" | "balance_adjustment";
};

export type TransactionAccountOption = {
  currency: string;
  /** 新增记账流程（#943）带持有人；其他表单不读取。 */
  holders?: { display_name: string }[];
  id: string;
  name: string;
  /** 新增记账流程（#943）带账户类型；其他表单不读取。 */
  type?: AccountType;
};

export type TransactionCategoryOption = {
  iconName?: string | null;
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

export type TransactionHolderOption = {
  id: string;
  name: string;
};

export type TransactionFilterOptions = {
  accounts: TransactionAccountOption[];
  categories: TransactionCategoryOption[];
  /** 账户持有人（含占位成员），末尾为「未指定持有人」。 */
  holders: TransactionHolderOption[];
  members: TransactionMemberOption[];
  merchants: MerchantSummary[];
  transactionItemSpecialStatusEnabled?: boolean;
};

export type TransactionFormOptions = {
  accountOptions: TransactionAccountOption[];
  categoryOptions: TransactionCategoryOption[];
  frequentCategoryIds: string[];
  merchantOptions: MerchantSummary[];
  multiAccountPaymentEnabled: boolean;
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

/** 组头「含共同支付 N 笔 · 整笔 Y」的数据，只在组合计含命中明细全额时给出。 */
export type TransactionSharedPaymentSummary = {
  recordCount: number;
  recordTotalAmount: string;
};

export type TransactionGroupSummaryItem = {
  id: string;
  key: string;
  label: string;
  sharedPayment?: TransactionSharedPaymentSummary;
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

/** 新增记账页（#943）：账户必带持有人、商家带商家分类。 */
export type TransactionEntryOptions = Omit<
  TransactionFormOptions,
  "accountOptions" | "merchantOptions"
> & {
  accountOptions: (TransactionAccountOption & {
    holders: { display_name: string }[];
    type: AccountType;
  })[];
  merchantOptions: MerchantEntryOptions["merchants"];
  merchantTags: MerchantEntryOptions["tags"];
};

export type NewTransactionView = TransactionEntryOptions & {
  canWriteTransactions: boolean;
  /** 浏览器端读取常用商家与商家建议时使用（#948）。 */
  ledgerId: string;
  ledgerName: string;
};

/** 编辑记录的读取模型；选项默认是旧表单用的 `TransactionFormOptions`。 */
export type EditTransactionView<
  Options extends EditTransactionViewOptions = TransactionFormOptions,
> = Options & {
  canDelete: boolean;
  editRestriction: TransactionEditRestriction | null;
  initialValues:
    | BalanceAdjustmentEditInitialValues
    | TransferEditInitialValues
    | {
        // 记录级乐观锁版本（transaction_record.updated_at），表单原样回传。
        expectedRecordUpdatedAt?: string;
        payments: TransactionPayment[];
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
          reimbursementAmount?: string;
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

type EditTransactionViewOptions = Pick<
  TransactionFormOptions,
  "accountOptions" | "categoryOptions"
>;

/** 编辑记账页（#962）：选项与新增记账一致（账户带持有人、商家带商家分类），另附账本 ID 供浏览器端读取商家建议。 */
export type EditTransactionEntryView =
  EditTransactionView<TransactionEntryOptions> & {
    ledgerId: string;
  };
