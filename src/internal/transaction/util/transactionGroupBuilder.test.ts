import { describe, expect, it } from "vitest";

import type {
  AccountOptionDbRow,
  AppUserSummaryDbRow,
  CategorySummaryDbRow,
  TransactionItemDbRow,
  TransactionRecordDbRow,
} from "internal/db-types";
import {
  defaultTransactionFilters,
  type TransactionFilters,
  type TransactionGroupBy,
} from "internal/transaction/entity/transactionGrouping";

import {
  filterTransactionItems,
  filterTransactionRecords,
  normalizeTransactionFilters,
} from "./grouping/filters";
import {
  createHolderGroupLoaderContext,
  holderIds,
  holderRecords,
} from "./grouping/accountHolder.testUtils";
import type { TransactionGroupLoaderContext } from "./grouping/types";
import {
  createHospitalGroupLoaderContext,
  hospitalAccounts,
  hospitalCategories,
} from "./grouping/splitPayment.testUtils";
import { buildTransactionGroupSummaryPage } from "./transactionGroupBuilder";

const expenseCategory: CategorySummaryDbRow = {
  id: "expense-category",
  name: "支出分类",
  parent_id: null,
  type: "expense",
};

const incomeCategory: CategorySummaryDbRow = {
  id: "income-category",
  name: "收入分类",
  parent_id: null,
  type: "income",
};

const categories = [expenseCategory, incomeCategory];
const accounts: AccountOptionDbRow[] = [];
const merchants: { id: string; name: string }[] = [];
const recorders: AppUserSummaryDbRow[] = [];

function record(
  id: string,
  transactionAt: string,
  type: TransactionRecordDbRow["type"] = "normal",
): TransactionRecordDbRow {
  return {
    created_at: transactionAt,
    created_by: null,
    id,
    merchant_id: null,
    note: null,
    transaction_at: transactionAt,
    type,
  };
}

function item(
  recordId: string,
  categoryId: string | null,
  amount: string,
  specialStatus?: TransactionItemDbRow["special_status"],
): TransactionItemDbRow {
  return {
    account_id: "account-1",
    amount,
    category_id: categoryId,
    special_status: specialStatus,
    transaction_record_id: recordId,
  };
}

describe("buildTransactionGroupSummaryPage", () => {
  it("转账记录计入分组笔数但不计入收支汇总", () => {
    const records = [
      record("expense-1", "2026-06-10T01:00:00.000Z"),
      record("transfer-1", "2026-06-10T02:00:00.000Z", "transfer"),
    ];
    const items = [item("expense-1", expenseCategory.id, "1200")];

    const page = buildTransactionGroupSummaryPage({
      accounts,
      categories,
      currency: "JPY",
      holderIdsByAccountId: new Map(),
      groupBy: "month",
      items,
      merchants,
      offset: 0,
      pageSize: 20,
      payments: [],
      filters: defaultTransactionFilters,
      records,
      recorders,
    });

    expect(page.groups).toHaveLength(1);
    expect(page.groups[0].transactionCount).toBe(2);
    expect(page.groups[0].summary).toEqual({
      balance: "-1200",
      currency: "JPY",
      expense: "1200",
      income: "0",
    });
  });

  it("净额为零时按分类类型归属收支：仅含支出分类归为支出", () => {
    const records = [record("zero-expense", "2026-06-10T01:00:00.000Z")];
    const items = [item("zero-expense", expenseCategory.id, "0")];

    const page = buildTransactionGroupSummaryPage({
      accounts,
      categories,
      currency: "JPY",
      holderIdsByAccountId: new Map(),
      groupBy: "month",
      items,
      merchants,
      offset: 0,
      pageSize: 20,
      payments: [],
      filters: defaultTransactionFilters,
      records,
      recorders,
    });

    expect(page.groups[0].transactionCount).toBe(1);
    expect(page.groups[0].summary).toEqual({
      balance: "0",
      currency: "JPY",
      expense: "0",
      income: "0",
    });
  });

  it("净额为零的混合收支记录不影响分组收支汇总，但仍计入笔数", () => {
    const records = [record("mixed-zero", "2026-06-10T01:00:00.000Z")];
    const items = [
      item("mixed-zero", incomeCategory.id, "500"),
      item("mixed-zero", expenseCategory.id, "500"),
    ];

    const page = buildTransactionGroupSummaryPage({
      accounts,
      categories,
      currency: "JPY",
      holderIdsByAccountId: new Map(),
      groupBy: "month",
      items,
      merchants,
      offset: 0,
      pageSize: 20,
      payments: [],
      filters: defaultTransactionFilters,
      records,
      recorders,
    });

    expect(page.groups[0].transactionCount).toBe(1);
    expect(page.groups[0].summary).toEqual({
      balance: "0",
      currency: "JPY",
      expense: "0",
      income: "0",
    });
  });

  it("按分组分页并返回 nextOffset", () => {
    const records = [
      record("r1", "2026-06-10T00:00:00.000Z"),
      record("r2", "2026-05-10T00:00:00.000Z"),
      record("r3", "2026-04-10T00:00:00.000Z"),
    ];
    const items = [
      item("r1", expenseCategory.id, "100"),
      item("r2", expenseCategory.id, "200"),
      item("r3", expenseCategory.id, "300"),
    ];

    const page = buildTransactionGroupSummaryPage({
      accounts,
      categories,
      currency: "JPY",
      holderIdsByAccountId: new Map(),
      groupBy: "month",
      items,
      merchants,
      offset: 0,
      pageSize: 2,
      payments: [],
      filters: defaultTransactionFilters,
      records,
      recorders,
    });

    expect(page.groups.map((group) => group.key)).toEqual([
      "2026-06",
      "2026-05",
    ]);
    expect(page.nextOffset).toBe(2);
  });

  it("特殊状态分组展示三种报销结算状态", () => {
    const records = [record("r1", "2026-06-10T00:00:00.000Z")];
    const items = [
      {
        ...item("r1", expenseCategory.id, "100", "reimbursed"),
        business_net_amount: "0",
      },
      item("r1", expenseCategory.id, "200", "pending_reimbursement"),
      item("r1", expenseCategory.id, "300", "reimbursement_surplus"),
      item("r1", expenseCategory.id, "400", null),
    ];

    const page = buildTransactionGroupSummaryPage({
      accounts,
      categories,
      currency: "JPY",
      holderIdsByAccountId: new Map(),
      groupBy: "specialStatus",
      items,
      merchants,
      offset: 0,
      pageSize: 20,
      payments: [],
      filters: defaultTransactionFilters,
      records,
      recorders,
    });

    expect(page.groups.map((group) => group.key)).toEqual([
      "pending_reimbursement",
      "reimbursed",
      "reimbursement_surplus",
    ]);
    // 分组名称直接锁定显示文字，确认改为引用特殊状态名称定义后显示不变。
    expect(page.groups.map((group) => group.label)).toEqual([
      "待报销",
      "已结清",
      "核销结余",
    ]);
    expect(page.groups.map((group) => group.transactionCount)).toEqual([
      1, 1, 1,
    ]);
    expect(page.groups[1].summary.expense).toBe("0");
  });
});

it.each(["2500", "-2500"])("余额调整 %s 计入流水笔数但不计入收支", (delta) => {
  const page = buildTransactionGroupSummaryPage({
    accounts,
    categories,
    currency: "JPY",
    holderIdsByAccountId: new Map(),
    groupBy: "month",
    items: [{ ...item("adjustment", null, "2500"), balance_delta: delta }],
    merchants,
    offset: 0,
    pageSize: 20,
    payments: [],
    filters: defaultTransactionFilters,
    records: [
      record("adjustment", "2026-09-14T00:00:00Z", "balance_adjustment"),
    ],
    recorders,
  });
  expect(page.groups[0]).toMatchObject({
    transactionCount: 1,
    summary: { income: "0", expense: "0", balance: "0" },
  });
});

/** 与列表 loader 相同：先按筛选取记录与明细，再在内存中分组。 */
function buildPageFromContext(
  context: TransactionGroupLoaderContext,
  groupBy: TransactionGroupBy,
  filters: Omit<TransactionFilters, "recordType">,
) {
  const normalizedFilters = normalizeTransactionFilters({
    recordType: "all",
    ...filters,
  });

  return buildTransactionGroupSummaryPage({
    accounts: context.accounts,
    categories: context.categories,
    currency: "JPY",
    holderIdsByAccountId: context.holderIdsByAccountId,
    filters: normalizedFilters,
    groupBy,
    items: filterTransactionItems(context, normalizedFilters),
    merchants: context.merchants,
    offset: 0,
    pageSize: 20,
    payments: context.payments,
    records: filterTransactionRecords(context, normalizedFilters),
    recorders: context.recorders,
  });
}

describe("buildTransactionGroupSummaryPage 医院 12 万（方案 D）", () => {
  const mine = hospitalAccounts.mine.id;
  const inpatient = hospitalCategories.inpatient.id;

  function buildHospitalPage(
    groupBy: TransactionGroupBy,
    filters: Omit<TransactionFilters, "recordType"> = {},
  ) {
    return buildPageFromContext(
      createHospitalGroupLoaderContext(),
      groupBy,
      filters,
    ).groups.map((group) => ({
      expense: group.summary.expense,
      label: group.label,
      sharedPayment: group.sharedPayment,
    }));
  }

  it("无筛选：按月 12 万；按分类住院费 8 万、治疗费 4 万；按账户我 5 万、妻子 7 万", () => {
    expect(buildHospitalPage("month")).toEqual([
      {
        expense: "120000",
        label: expect.any(String),
        sharedPayment: undefined,
      },
    ]);
    expect(buildHospitalPage("category")).toEqual(
      expect.arrayContaining([
        { expense: "80000", label: "住院费", sharedPayment: undefined },
        { expense: "40000", label: "治疗费", sharedPayment: undefined },
      ]),
    );
    expect(buildHospitalPage("account")).toEqual(
      expect.arrayContaining([
        { expense: "50000", label: "我的账户", sharedPayment: undefined },
        { expense: "70000", label: "妻子账户", sharedPayment: undefined },
      ]),
    );
  });

  it("筛选我的账户：按月 / 商家 / 成员计份额 5 万，不需要组头提示", () => {
    for (const groupBy of ["month", "merchant", "member"] as const) {
      expect(buildHospitalPage(groupBy, { accountId: mine })).toEqual([
        {
          expense: "50000",
          label: expect.any(String),
          sharedPayment: undefined,
        },
      ]);
    }
  });

  it("筛选我的账户按分类：明细全额，并带共同支付提示", () => {
    const sharedPayment = {
      accountShareAmount: "50000",
      recordCount: 1,
      recordTotalAmount: "120000",
    };

    expect(buildHospitalPage("category", { accountId: mine })).toEqual(
      expect.arrayContaining([
        { expense: "80000", label: "住院费", sharedPayment },
        { expense: "40000", label: "治疗费", sharedPayment },
      ]),
    );
    expect(buildHospitalPage("parentCategory", { accountId: mine })).toEqual([
      { expense: "120000", label: "医疗", sharedPayment },
    ]);
  });

  it("筛选我的账户按账户分组：只有「我的账户」组 5 万", () => {
    expect(buildHospitalPage("account", { accountId: mine })).toEqual([
      { expense: "50000", label: "我的账户", sharedPayment: undefined },
    ]);
  });

  it("筛选我的账户 + 住院费按月：8 万，并带共同支付提示（本账户 5 万 / 整笔 12 万）", () => {
    expect(
      buildHospitalPage("month", { accountId: mine, categoryId: inpatient }),
    ).toEqual([
      {
        expense: "80000",
        label: expect.any(String),
        sharedPayment: {
          accountShareAmount: "50000",
          recordCount: 1,
          recordTotalAmount: "120000",
        },
      },
    ]);
  });
});

describe("buildTransactionGroupSummaryPage 持有人维度（#909）", () => {
  function buildMonthSummary(
    records: TransactionRecordDbRow[],
    filters: Omit<TransactionFilters, "recordType">,
  ) {
    return buildPageFromContext(
      createHolderGroupLoaderContext(records),
      "month",
      filters,
    ).groups.map((group) => ({
      sharedPayment: group.sharedPayment,
      summary: group.summary,
      transactionCount: group.transactionCount,
    }));
  }

  it("筛选「我」按月：本月 -5 万 + 1 万", () => {
    expect(
      buildMonthSummary([holderRecords.hospital, holderRecords.refund], {
        holderId: holderIds.me,
      }),
    ).toEqual([
      {
        sharedPayment: undefined,
        summary: {
          balance: "-40000",
          currency: "JPY",
          expense: "50000",
          income: "10000",
        },
        transactionCount: 2,
      },
    ]);
  });

  it("筛选「我」按月：共同支付、转账、余额调整与其他持有人的记录合计 -4.3 万", () => {
    expect(
      buildMonthSummary(Object.values(holderRecords), {
        holderId: holderIds.me,
      }),
    ).toEqual([
      {
        sharedPayment: undefined,
        summary: {
          balance: "-43000",
          currency: "JPY",
          expense: "53000",
          income: "10000",
        },
        // 医院、退款、共同支付、两笔转账、余额调整；无持有人与占位成员账户的记录不出现。
        transactionCount: 6,
      },
    ]);
  });

  it("筛选「我」+ 分类：明细级筛选优先，带共同支付提示", () => {
    expect(
      buildMonthSummary([holderRecords.hospital, holderRecords.refund], {
        categoryId: "category-checkup",
        holderId: holderIds.me,
      }),
    ).toEqual([
      {
        sharedPayment: {
          accountShareAmount: "50000",
          recordCount: 1,
          recordTotalAmount: "120000",
        },
        summary: {
          balance: "-70000",
          currency: "JPY",
          expense: "70000",
          income: "0",
        },
        transactionCount: 1,
      },
    ]);
  });

  it("按持有人分组只由数据库分组函数汇总，内存分组拒绝", () => {
    expect(() =>
      buildPageFromContext(createHolderGroupLoaderContext(), "holder", {}),
    ).toThrow("holder");
  });
});
