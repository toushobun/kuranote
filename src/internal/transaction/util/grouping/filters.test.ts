import { describe, expect, it } from "vitest";

import type {
  CategorySummaryDbRow,
  TransactionItemDbRow,
  TransactionRecordDbRow,
} from "internal/db-types";

import { filterTransactionItems, filterTransactionRecords } from "./filters";
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
