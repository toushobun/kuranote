import type {
  AccountOptionDbRow,
  CategorySummaryDbRow,
  TransactionItemDbRow,
  TransactionPaymentDbRow,
  TransactionRecordDbRow,
} from "internal/db-types";
import type { TransactionGroupLoaderContext } from "internal/transaction/util/grouping/types";

// #909 持有人统计的测试例子，与 supabase/tests/database/account_holder_group_summaries.test.sql 相同：
// 医院 12 万（治疗费 4 万 + 检查费 8 万）由我的现金 5 万、妻子现金 7 万支付；
// 之后退款 1 万进入我的礼品卡并关联检查费（检查费业务净额 7 万，退款收入业务净额 0）。
// 另有我名下两个账户共同支付、转账、余额调整、无持有人账户与占位成员账户的记录。

export const holderIds = {
  grandma: "placeholder-grandma",
  me: "user-me",
  wife: "user-wife",
} as const;

export const holderAccounts = {
  grandmaWallet: { currency: "JPY", id: "account-grandma", name: "奶奶的钱包" },
  myBank: { currency: "JPY", id: "account-my-bank", name: "我的银行" },
  myCash: { currency: "JPY", id: "account-my-cash", name: "我的现金" },
  myGiftCard: { currency: "JPY", id: "account-my-gift", name: "我的礼品卡" },
  sharedWallet: { currency: "JPY", id: "account-shared", name: "公共钱包" },
  wifeCash: { currency: "JPY", id: "account-wife-cash", name: "妻子现金" },
} satisfies Record<string, AccountOptionDbRow>;

/** 公共钱包没有持有人（不在映射中）。 */
export const holderIdsByAccountId = new Map<string, string[]>([
  [holderAccounts.grandmaWallet.id, [holderIds.grandma]],
  [holderAccounts.myBank.id, [holderIds.me]],
  [holderAccounts.myCash.id, [holderIds.me]],
  [holderAccounts.myGiftCard.id, [holderIds.me]],
  [holderAccounts.wifeCash.id, [holderIds.wife]],
]);

export const holderCategories = {
  checkup: {
    id: "category-checkup",
    name: "检查费",
    parent_id: "category-medical",
    type: "expense",
  },
  food: {
    id: "category-food",
    name: "餐饮",
    parent_id: null,
    type: "expense",
  },
  medical: {
    id: "category-medical",
    name: "医疗",
    parent_id: null,
    type: "expense",
  },
  refund: {
    id: "category-refund",
    name: "退款",
    parent_id: null,
    type: "income",
  },
  treatment: {
    id: "category-treatment",
    name: "治疗费",
    parent_id: "category-medical",
    type: "expense",
  },
} satisfies Record<string, CategorySummaryDbRow>;

function holderRecord(
  id: string,
  transactionAt: string,
  type: TransactionRecordDbRow["type"] = "normal",
): TransactionRecordDbRow {
  return {
    created_at: transactionAt,
    created_by: holderIds.me,
    id,
    merchant_id: null,
    note: null,
    transaction_at: transactionAt,
    type,
  };
}

function payment(
  recordId: string,
  accountId: string,
  balanceDelta: number,
  sortOrder = 0,
): TransactionPaymentDbRow {
  return {
    account_id: accountId,
    amount: String(Math.abs(balanceDelta)),
    balance_delta: String(balanceDelta),
    sort_order: sortOrder,
    transaction_record_id: recordId,
  };
}

function normalItem(
  recordId: string,
  categoryId: string,
  amount: number,
  overrides: Partial<TransactionItemDbRow> = {},
): TransactionItemDbRow {
  return {
    account_id: null,
    amount: String(amount),
    business_net_amount: String(amount),
    category_id: categoryId,
    id: `${recordId}-${categoryId}`,
    transaction_record_id: recordId,
    ...overrides,
  };
}

function accountItem(
  recordId: string,
  accountId: string,
  balanceDelta: number,
): TransactionItemDbRow {
  return {
    account_id: accountId,
    amount: String(Math.abs(balanceDelta)),
    balance_delta: String(balanceDelta),
    category_id: null,
    id: `${recordId}-${accountId}`,
    transaction_record_id: recordId,
  };
}

export const holderRecords = {
  adjustment: holderRecord(
    "record-adjustment",
    "2026-10-18T01:00:00.000Z",
    "balance_adjustment",
  ),
  grandma: holderRecord("record-grandma", "2026-10-20T01:00:00.000Z"),
  hospital: holderRecord("record-hospital", "2026-10-10T01:00:00.000Z"),
  refund: holderRecord("record-refund", "2026-10-12T01:00:00.000Z"),
  sharedMine: holderRecord("record-shared-mine", "2026-10-15T01:00:00.000Z"),
  transferMine: holderRecord(
    "record-transfer-mine",
    "2026-10-16T01:00:00.000Z",
    "transfer",
  ),
  transferToWife: holderRecord(
    "record-transfer-wife",
    "2026-10-17T01:00:00.000Z",
    "transfer",
  ),
  unassigned: holderRecord("record-unassigned", "2026-10-19T01:00:00.000Z"),
};

export const holderItems: TransactionItemDbRow[] = [
  normalItem(holderRecords.hospital.id, holderCategories.treatment.id, 40000),
  normalItem(holderRecords.hospital.id, holderCategories.checkup.id, 80000, {
    business_net_amount: "70000",
    has_refund_link: true,
    refunded_amount: "10000",
  }),
  normalItem(holderRecords.refund.id, holderCategories.refund.id, 10000, {
    business_net_amount: "0",
    has_refund_link: true,
    is_refund_income: true,
  }),
  normalItem(holderRecords.sharedMine.id, holderCategories.food.id, 3000),
  accountItem(holderRecords.transferMine.id, holderAccounts.myCash.id, -5000),
  accountItem(holderRecords.transferMine.id, holderAccounts.myBank.id, 5000),
  accountItem(holderRecords.transferToWife.id, holderAccounts.myCash.id, -2000),
  accountItem(
    holderRecords.transferToWife.id,
    holderAccounts.wifeCash.id,
    2000,
  ),
  accountItem(holderRecords.adjustment.id, holderAccounts.myCash.id, 500),
  normalItem(holderRecords.unassigned.id, holderCategories.food.id, 800),
  normalItem(holderRecords.grandma.id, holderCategories.food.id, 600),
];

export const holderPayments: TransactionPaymentDbRow[] = [
  payment(holderRecords.hospital.id, holderAccounts.myCash.id, -50000, 0),
  payment(holderRecords.hospital.id, holderAccounts.wifeCash.id, -70000, 1),
  payment(holderRecords.refund.id, holderAccounts.myGiftCard.id, 10000),
  payment(holderRecords.sharedMine.id, holderAccounts.myCash.id, -1000, 0),
  payment(holderRecords.sharedMine.id, holderAccounts.myBank.id, -2000, 1),
  payment(holderRecords.unassigned.id, holderAccounts.sharedWallet.id, -800),
  payment(holderRecords.grandma.id, holderAccounts.grandmaWallet.id, -600),
];

export const holderCategoryList: CategorySummaryDbRow[] =
  Object.values(holderCategories);
export const holderCategoryById = new Map(
  holderCategoryList.map((category) => [category.id, category] as const),
);

export function createHolderGroupLoaderContext(
  records: TransactionRecordDbRow[] = Object.values(holderRecords),
): TransactionGroupLoaderContext {
  const recordIds = new Set(records.map((record) => record.id));

  return {
    accountColorById: new Map(),
    accounts: Object.values(holderAccounts),
    categories: holderCategoryList,
    currentLedger: {
      baseCurrency: "JPY",
      currentUserRole: "owner",
      id: "ledger-1",
      name: "测试账本",
    },
    holderIdsByAccountId,
    items: holderItems.filter((item) =>
      recordIds.has(item.transaction_record_id),
    ),
    merchants: [],
    payments: holderPayments.filter((item) =>
      recordIds.has(item.transaction_record_id),
    ),
    records,
    recorders: [{ display_name: "我", id: holderIds.me }],
    showRecorder: true,
  };
}
