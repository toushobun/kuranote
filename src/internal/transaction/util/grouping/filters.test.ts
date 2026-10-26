import { describe, expect, it } from "vitest";

import type {
  CategorySummaryDbRow,
  TransactionItemDbRow,
  TransactionRecordDbRow,
} from "internal/db-types";

import {
  filterTransactionItems,
  filterTransactionRecords,
  hasNonAccountItemFilters,
} from "./filters";
import {
  createHospitalGroupLoaderContext,
  hospitalAccounts,
  hospitalCategories,
  hospitalItems,
} from "./splitPayment.testUtils";
import type { TransactionGroupLoaderContext } from "./types";

const ledgerId = "00000000-0000-4000-8000-000000000001";

function record(id: string, transactionAt: string): TransactionRecordDbRow {
  return {
    created_at: transactionAt,
    created_by: null,
    id,
    merchant_id: null,
    note: null,
    transaction_at: transactionAt,
    type: "normal",
  };
}

function createContext(
  records: TransactionRecordDbRow[],
): TransactionGroupLoaderContext {
  return {
    accountColorById: new Map(),
    holderIdsByAccountId: new Map(),
    accounts: [],
    categories: [],
    currentLedger: {
      baseCurrency: "JPY",
      currentUserRole: "owner",
      id: ledgerId,
      name: "家庭账本",
    },
    items: [],
    merchants: [],
    payments: [],
    records,
    recorders: [],
  };
}

describe("filterTransactionRecords - 日期筛选校验", () => {
  const records = [
    record("r1", "2026-06-10T00:00:00.000Z"),
    record("r2", "2026-06-20T00:00:00.000Z"),
  ];

  it("合法的日期范围按预期过滤", () => {
    const context = createContext(records);

    const filtered = filterTransactionRecords(context, {
      dateFrom: "2026-06-15",
      recordType: "all",
    });

    expect(filtered.map((r) => r.id)).toEqual(["r2"]);
  });

  it("非法的 dateFrom 不参与原始字符串比较，按未指定处理", () => {
    const context = createContext(records);

    const filtered = filterTransactionRecords(context, {
      dateFrom: "not-a-date",
      recordType: "all",
    });

    expect(filtered.map((r) => r.id)).toEqual(["r1", "r2"]);
  });

  it("非法的 dateTo 不参与原始字符串比较，按未指定处理", () => {
    const context = createContext(records);

    const filtered = filterTransactionRecords(context, {
      dateTo: "2026/06/15",
      recordType: "all",
    });

    expect(filtered.map((r) => r.id)).toEqual(["r1", "r2"]);
  });
});

describe("特殊状态明细筛选", () => {
  const categories: CategorySummaryDbRow[] = [
    {
      id: "food",
      name: "餐饮",
      parent_id: null,
      type: "expense",
    },
    {
      id: "daily",
      name: "日用",
      parent_id: null,
      type: "expense",
    },
  ];
  const records = [record("r1", "2026-06-10T00:00:00.000Z")];
  const items: TransactionItemDbRow[] = [
    {
      account_id: "account-1",
      amount: "100",
      category_id: "food",
      special_status: "pending_reimbursement",
      transaction_record_id: "r1",
    },
    {
      account_id: "account-1",
      amount: "200",
      category_id: "daily",
      special_status: null,
      transaction_record_id: "r1",
    },
    {
      account_id: "account-1",
      amount: "300",
      category_id: "food",
      special_status: "reimbursement_surplus",
      transaction_record_id: "r1",
    },
  ];
  const context: TransactionGroupLoaderContext = {
    ...createContext(records),
    categories,
    items,
  };

  it("特殊状态筛选只匹配待报销明细", () => {
    expect(
      filterTransactionItems(context, {
        recordType: "all",
        specialStatuses: ["pendingReimbursement"],
      }),
    ).toEqual([items[0]]);
  });

  it("特殊状态筛选可以匹配核销结余明细", () => {
    expect(
      filterTransactionItems(context, {
        recordType: "all",
        specialStatuses: ["reimbursementSurplus"],
      }),
    ).toEqual([items[2]]);
  });

  it("分类与特殊状态按同一条明细执行 AND", () => {
    expect(
      filterTransactionItems(context, {
        categoryId: "daily",
        recordType: "all",
        specialStatuses: ["pendingReimbursement"],
      }),
    ).toEqual([]);
    expect(
      filterTransactionRecords(context, {
        categoryId: "daily",
        recordType: "all",
        specialStatuses: ["pendingReimbursement"],
      }),
    ).toEqual([]);
  });
});

describe("账户筛选按付款明细（记录级）", () => {
  const context = createHospitalGroupLoaderContext();

  it("付款明细包含该账户即命中记录，明细账户镜像不参与判断", () => {
    expect(
      filterTransactionRecords(context, {
        accountId: hospitalAccounts.wife.id,
        recordType: "all",
      }).map((record) => record.id),
    ).toEqual(["record-hospital"]);
    expect(
      filterTransactionRecords(context, {
        accountId: "account-other",
        recordType: "all",
      }),
    ).toEqual([]);
  });

  it("只有账户筛选时不剔除明细", () => {
    expect(
      filterTransactionItems(context, {
        accountId: hospitalAccounts.wife.id,
        recordType: "all",
      }),
    ).toEqual(hospitalItems);
  });

  it("账户筛选与分类筛选同时存在时，命中部分由分类决定", () => {
    expect(
      filterTransactionItems(context, {
        accountId: hospitalAccounts.wife.id,
        categoryId: hospitalCategories.inpatient.id,
        recordType: "all",
      }).map((item) => item.id),
    ).toEqual(["item-inpatient"]);
  });

  it("hasNonAccountItemFilters 不把账户计入明细级筛选", () => {
    expect(
      hasNonAccountItemFilters({ accountId: "account", recordType: "all" }),
    ).toBe(false);
    expect(hasNonAccountItemFilters({ recordType: "refundableExpense" })).toBe(
      true,
    );
    expect(
      hasNonAccountItemFilters({ categoryId: "category", recordType: "all" }),
    ).toBe(true);
  });

  it("转账记录仍按明细账户筛选", () => {
    const transferContext = createHospitalGroupLoaderContext({
      items: [
        {
          account_id: "account-from",
          amount: "100",
          balance_delta: "-100",
          category_id: null,
          transaction_record_id: "record-transfer",
        },
      ],
      payments: [],
      records: [
        {
          created_at: "2026-10-10T00:00:00.000Z",
          id: "record-transfer",
          merchant_id: null,
          note: null,
          transaction_at: "2026-10-10T00:00:00.000Z",
          type: "transfer",
        },
      ],
    });

    expect(
      filterTransactionRecords(transferContext, {
        accountId: "account-from",
        recordType: "all",
      }),
    ).toHaveLength(1);
  });
});
