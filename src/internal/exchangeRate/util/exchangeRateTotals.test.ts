import { describe, expect, it } from "vitest";
import { buildStatisticsViewData } from "internal/statistics/service/read/statisticsView";
import { buildTransactionGroupSummaryPage } from "internal/transaction/util/transactionGroupBuilder";
import { defaultTransactionFilters } from "internal/transaction/entity/transactionGrouping";
import { groupTransactionItemsByDate } from "utils/transactions";

const date = "2026-11-20T01:00:00.000Z";
function record(id: string, rate: number | null, currency: string) {
  return {
    id,
    type: "normal" as const,
    transaction_at: date,
    created_at: date,
    merchant_id: "merchant",
    created_by: null,
    note: null,
    ledger_rate: rate,
    record_currency: currency,
  };
}

describe("Issue #1139 交易合计一致性", () => {
  it("两笔外币记录先分别舍入再合计，缺失汇率的记录不计入", () => {
    const view = buildStatisticsViewData({
      categories: [
        {
          id: "expense",
          name: "日用品",
          type: "expense" as const,
          parent_id: null,
        },
      ],
      currency: "JPY",
      items: [
        { transaction_record_id: "a", category_id: "expense", amount: "1" },
        { transaction_record_id: "b", category_id: "expense", amount: "1" },
        { transaction_record_id: "c", category_id: "expense", amount: "1000" },
      ],
      ledgerName: "家庭账本",
      merchants: [{ id: "merchant", name: "超市" }],
      month: "2026-11",
      records: [
        record("a", 1.235, "USD"),
        record("b", 1.235, "USD"),
        record("c", null, "THB"),
      ],
    });
    expect(view.summary).toMatchObject({
      expense: "2.48",
      hasForeignCurrency: true,
      missingRateCount: 1,
    });
    expect(view.categoryExpenseRanking[0].amount).toBe("2.48");
  });

  it("时间分组与每日小计使用记录级汇率并保留原币主金额", () => {
    const records = [record("a", 2, "USD"), record("b", null, "THB")];
    const items = records.map((r) => ({
      transaction_record_id: r.id,
      account_id: null,
      amount: "10",
      category_id: "expense",
    }));
    const page = buildTransactionGroupSummaryPage({
      accounts: [],
      categories: [
        { id: "expense", name: "餐饮", type: "expense", parent_id: null },
      ],
      currency: "JPY",
      holderIdsByAccountId: new Map(),
      filters: defaultTransactionFilters,
      groupBy: "day",
      items,
      merchants: [],
      offset: 0,
      pageSize: 20,
      payments: [],
      records,
      recorders: [],
    });
    expect(page.groups[0].summary).toMatchObject({
      expense: "20",
      hasForeignCurrency: true,
      missingRateCount: 1,
    });
    const dateGroups = groupTransactionItemsByDate(
      [
        {
          id: "a",
          type: "expense",
          amount: "10",
          account_currency: "USD",
          converted_amount: "20",
          transaction_at: date,
        },
        {
          id: "b",
          type: "expense",
          amount: "10",
          account_currency: "THB",
          converted_amount: null,
          transaction_at: date,
        },
      ] as never,
      "JPY",
    );
    expect(dateGroups[0].summary).toMatchObject({
      expense: "20",
      hasForeignCurrency: true,
      missingRateCount: 1,
    });
  });

  it("SQL/TS 同一批跨日记录：商家/持有人换算，账户分组保留原币", () => {
    const records = [
      {
        ...record("jpy-1", 0.01, "JPY"),
        transaction_at: "2099-01-15T12:00:00Z",
      },
      {
        ...record("jpy-2", 0.02, "JPY"),
        transaction_at: "2099-01-16T12:00:00Z",
      },
    ];
    const items = records.map((r) => ({
      account_id: null,
      amount: "10000",
      category_id: "expense",
      transaction_record_id: r.id,
    }));
    const payments = records.map((r) => ({
      account_id: "jpy-account",
      amount: "10000",
      balance_delta: "-10000",
      sort_order: 0,
      transaction_record_id: r.id,
    }));
    const build = (
      groupBy: "merchant" | "account",
      rateRecords = records,
    ) =>
      buildTransactionGroupSummaryPage({
        accounts: [{ id: "jpy-account", name: "日元钱包", currency: "JPY" }],
        categories: [
          { id: "expense", name: "餐饮", type: "expense", parent_id: null },
        ],
        currency: "USD",
        filters: defaultTransactionFilters,
        groupBy,
        holderIdsByAccountId: new Map([["jpy-account", ["holder-1"]]]),
        items,
        merchants: [{ id: "merchant", name: "超市" }],
        offset: 0,
        pageSize: 20,
        payments,
        records: rateRecords,
        recorders: [],
      });
    expect(build("merchant").groups[0].summary).toMatchObject({
      expense: "300",
      balance: "-300",
      currency: "USD",
    });
    expect(build("account").groups[0].summary).toMatchObject({
      expense: "20000",
      currency: "JPY",
    });
    const missingRates = records.map((r) => ({ ...r, ledger_rate: null }));
    expect(build("merchant", missingRates).groups[0].summary).toMatchObject({
      expense: "0",
      missingRateCount: 2,
    });
    expect(build("account", missingRates).groups[0].summary).toMatchObject({
      expense: "20000",
      currency: "JPY",
    });
  });
});
