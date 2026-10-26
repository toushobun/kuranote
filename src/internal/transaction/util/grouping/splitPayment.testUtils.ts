import type {
  AccountOptionDbRow,
  CategorySummaryDbRow,
  TransactionItemDbRow,
  TransactionPaymentDbRow,
  TransactionRecordDbRow,
} from "internal/db-types";
import type { TransactionGroupLoaderContext } from "internal/transaction/util/grouping/types";

// 医院 12 万（docs/design/issue-834-split-payment.md 的示例）：
// 治疗费 4 万 + 住院费 8 万；我的账户 5 万、妻子账户 7 万。
// 普通记录明细不保存账户（account_id 为 NULL），账户只来自付款明细。

export const hospitalAccounts = {
  mine: { currency: "JPY", id: "account-mine", name: "我的账户" },
  wife: { currency: "JPY", id: "account-wife", name: "妻子账户" },
} satisfies Record<string, AccountOptionDbRow>;

export const hospitalCategories = {
  inpatient: {
    id: "category-inpatient",
    name: "住院费",
    parent_id: "category-medical",
    type: "expense",
  },
  medical: {
    id: "category-medical",
    name: "医疗",
    parent_id: null,
    type: "expense",
  },
  treatment: {
    id: "category-treatment",
    name: "治疗费",
    parent_id: "category-medical",
    type: "expense",
  },
} satisfies Record<string, CategorySummaryDbRow>;

export const hospitalMerchant = {
  icon_url: null,
  id: "merchant-hospital",
  name: "妇产科医院",
};

export const hospitalRecord: TransactionRecordDbRow = {
  created_at: "2026-10-10T01:00:00.000Z",
  created_by: "user-a",
  id: "record-hospital",
  merchant_id: hospitalMerchant.id,
  note: null,
  transaction_at: "2026-10-10T01:00:00.000Z",
  type: "normal",
};

export const hospitalItems: TransactionItemDbRow[] = [
  {
    account_id: null,
    amount: "40000",
    business_net_amount: "40000",
    category_id: hospitalCategories.treatment.id,
    id: "item-treatment",
    transaction_record_id: hospitalRecord.id,
  },
  {
    account_id: null,
    amount: "80000",
    business_net_amount: "80000",
    category_id: hospitalCategories.inpatient.id,
    id: "item-inpatient",
    transaction_record_id: hospitalRecord.id,
  },
];

export const hospitalPayments: TransactionPaymentDbRow[] = [
  {
    account_id: hospitalAccounts.mine.id,
    amount: "50000",
    balance_delta: "-50000",
    sort_order: 0,
    transaction_record_id: hospitalRecord.id,
  },
  {
    account_id: hospitalAccounts.wife.id,
    amount: "70000",
    balance_delta: "-70000",
    sort_order: 1,
    transaction_record_id: hospitalRecord.id,
  },
];

export const hospitalAccountList = Object.values(hospitalAccounts);
export const hospitalCategoryList: CategorySummaryDbRow[] =
  Object.values(hospitalCategories);
export const hospitalCategoryById = new Map(
  hospitalCategoryList.map((category) => [category.id, category] as const),
);

export function createHospitalGroupLoaderContext(
  overrides: Partial<TransactionGroupLoaderContext> = {},
): TransactionGroupLoaderContext {
  return {
    accountColorById: new Map(),
    holderIdsByAccountId: new Map(),
    accounts: hospitalAccountList,
    categories: hospitalCategoryList,
    currentLedger: {
      baseCurrency: "JPY",
      currentUserRole: "owner",
      id: "ledger-1",
      name: "测试账本",
    },
    items: hospitalItems,
    merchants: [hospitalMerchant],
    payments: hospitalPayments,
    records: [hospitalRecord],
    recorders: [{ display_name: "我", id: "user-a" }],
    showRecorder: true,
    ...overrides,
  };
}
