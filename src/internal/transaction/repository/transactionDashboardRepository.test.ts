// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

import { createSupabaseTransactionRepository } from "internal/transaction/repository/transactionRepository";

const ledgerId = "00000000-0000-4000-8000-000000000032";
const recordId = "00000000-0000-4000-8000-000000009001";
const categoryId = "00000000-0000-4000-8000-000000005072";
const accountId = "00000000-0000-4000-8000-000000000045";
const secondAccountId = "00000000-0000-4000-8000-000000000046";
const secondRecordId = "00000000-0000-4000-8000-000000009002";
const dashboardMonthInput = {
  dateEnd: "2026-07-01T00:00:00.000Z",
  dateStart: "2026-06-01T00:00:00.000Z",
  ledgerId,
};

type QueryResult = { data: unknown; error: unknown | null };

function createQuery(result: QueryResult = { data: [], error: null }) {
  const query = {
    eq: vi.fn(),
    gte: vi.fn(),
    in: vi.fn(),
    lt: vi.fn(),
    order: vi.fn(),
    range: vi.fn(),
    select: vi.fn(),
    then: (
      resolve: (value: QueryResult) => unknown,
      reject?: (reason: unknown) => unknown,
    ) => Promise.resolve(result).then(resolve, reject),
  };
  query.eq.mockReturnValue(query);
  query.gte.mockReturnValue(query);
  query.in.mockReturnValue(query);
  query.lt.mockReturnValue(query);
  query.order.mockReturnValue(query);
  query.range.mockReturnValue(query);
  query.select.mockReturnValue(query);
  return query;
}

type DashboardErrorCase = {
  expectedLog: string;
  queries: Record<string, ReturnType<typeof createQuery>>;
  stage: string;
};

function createRepository(
  queries: Record<string, ReturnType<typeof createQuery>>,
) {
  const from = vi.fn((table: string) => queries[table] ?? createQuery());
  const logger = { error: vi.fn(), info: vi.fn(), warn: vi.fn() };
  const repository = createSupabaseTransactionRepository(
    { from, rpc: vi.fn() } as never,
    logger,
  );
  return { from, logger, repository };
}

const dashboardErrorCases: DashboardErrorCase[] = [
  {
    expectedLog: "[transaction] failed to load dashboard month records",
    queries: {
      transaction_record: createQuery({
        data: null,
        error: { code: "record_error", message: "database details" },
      }),
    },
    stage: "记录",
  },
  {
    expectedLog: "[transaction] failed to load dashboard month items",
    queries: {
      transaction_item: createQuery({
        data: null,
        error: { code: "item_error", message: "database details" },
      }),
      transaction_record: createQuery({
        data: [{ id: recordId }],
        error: null,
      }),
    },
    stage: "明细",
  },
  {
    expectedLog: "[transaction] failed to load dashboard month category types",
    queries: {
      category: createQuery({
        data: null,
        error: { code: "category_error", message: "database details" },
      }),
      transaction_item: createQuery({
        data: [
          {
            amount: "1200",
            category_id: categoryId,
            transaction_record_id: recordId,
          },
        ],
        error: null,
      }),
      transaction_record: createQuery({
        data: [{ id: recordId }],
        error: null,
      }),
    },
    stage: "分类",
  },
];

describe("TransactionDashboardRepository", () => {
  it("本月汇总只读取记录 ID、金额、分类 ID 与分类类型", async () => {
    const recordQuery = createQuery({
      data: [{ id: recordId }],
      error: null,
    });
    const itemQuery = createQuery({
      data: [
        {
          amount: "1200",
          category_id: categoryId,
          transaction_record_id: recordId,
        },
      ],
      error: null,
    });
    const categoryQuery = createQuery({
      data: [{ id: categoryId, type: "expense" }],
      error: null,
    });
    const { repository } = createRepository({
      category: categoryQuery,
      transaction_item: itemQuery,
      transaction_record: recordQuery,
    });

    await expect(
      repository.loadDashboardMonthSource(dashboardMonthInput),
    ).resolves.toEqual({
      categories: [{ id: categoryId, type: "expense" }],
      items: [
        {
          amount: "1200",
          category_id: categoryId,
          transaction_record_id: recordId,
        },
      ],
    });
    expect(recordQuery.select).toHaveBeenCalledWith("id");
    expect(recordQuery.eq).toHaveBeenCalledWith("type", "normal");
    expect(recordQuery.gte).toHaveBeenCalledWith(
      "transaction_at",
      dashboardMonthInput.dateStart,
    );
    expect(recordQuery.lt).toHaveBeenCalledWith(
      "transaction_at",
      dashboardMonthInput.dateEnd,
    );
    expect(itemQuery.select).toHaveBeenCalledWith(
      "transaction_record_id, category_id, amount",
    );
    expect(categoryQuery.select).toHaveBeenCalledWith("id, type");
  });

  it("没有本月记录时不查询明细和分类", async () => {
    const recordQuery = createQuery();
    const { from, repository } = createRepository({
      transaction_record: recordQuery,
    });

    await expect(
      repository.loadDashboardMonthSource(dashboardMonthInput),
    ).resolves.toEqual({ categories: [], items: [] });
    expect(from).toHaveBeenCalledTimes(1);
  });

  it("明细没有分类时跳过分类查询", async () => {
    const recordQuery = createQuery({
      data: [{ id: recordId }],
      error: null,
    });
    const item = {
      amount: "1200",
      category_id: null,
      transaction_record_id: recordId,
    };
    const itemQuery = createQuery({ data: [item], error: null });
    const { from, repository } = createRepository({
      transaction_item: itemQuery,
      transaction_record: recordQuery,
    });

    await expect(
      repository.loadDashboardMonthSource(dashboardMonthInput),
    ).resolves.toEqual({ categories: [], items: [item] });
    expect(from).toHaveBeenCalledTimes(2);
    expect(from).not.toHaveBeenCalledWith("category");
  });

  it.each(dashboardErrorCases)(
    "$stage 查询失败时转换为安全应用错误",
    async ({ expectedLog, queries }) => {
      const { logger, repository } = createRepository(queries);

      await expect(
        repository.loadDashboardMonthSource(dashboardMonthInput),
      ).rejects.toMatchObject({
        code: "transaction_dashboard_summary_load_failed",
        message: "本月收支汇总加载失败，请稍后重试。",
      });
      expect(logger.error).toHaveBeenCalledOnce();
      expect(logger.error).toHaveBeenCalledWith(
        expectedLog,
        expect.objectContaining({ ledgerId }),
      );
    },
  );

  it("最近使用账户只读取必要字段并按记录顺序去重", async () => {
    const recordQuery = createQuery({
      data: [{ id: recordId }, { id: secondRecordId }],
      error: null,
    });
    const itemQuery = createQuery({
      data: [
        {
          account_id: secondAccountId,
          transaction_record_id: secondRecordId,
        },
        { account_id: accountId, transaction_record_id: recordId },
        { account_id: secondAccountId, transaction_record_id: recordId },
      ],
      error: null,
    });
    const { repository } = createRepository({
      transaction_item: itemQuery,
      transaction_record: recordQuery,
    });

    await expect(
      repository.loadDashboardRecentlyUsedAccountIds({
        ledgerId,
        limit: 100,
      }),
    ).resolves.toEqual([accountId, secondAccountId]);
    expect(recordQuery.select).toHaveBeenCalledWith("id");
    expect(recordQuery.in).toHaveBeenCalledWith("type", ["normal", "transfer"]);
    expect(recordQuery.range).toHaveBeenCalledWith(0, 99);
    expect(itemQuery.select).toHaveBeenCalledWith(
      "transaction_record_id, account_id",
    );
  });

  it("最近使用账户没有记录时不查询明细", async () => {
    const recordQuery = createQuery();
    const { from, repository } = createRepository({
      transaction_record: recordQuery,
    });

    await expect(
      repository.loadDashboardRecentlyUsedAccountIds({
        ledgerId,
        limit: 100,
      }),
    ).resolves.toEqual([]);
    expect(from).toHaveBeenCalledTimes(1);
  });

  it("normal 记录类型在查询阶段排除转账", async () => {
    const recordQuery = createQuery();
    const { repository } = createRepository({
      transaction_record: recordQuery,
    });

    await repository.listRecords({
      ledgerId,
      limit: 3,
      recordType: "normal",
    });

    expect(recordQuery.eq).toHaveBeenCalledWith("type", "normal");
    expect(recordQuery.range).toHaveBeenCalledWith(0, 2);
  });
});
