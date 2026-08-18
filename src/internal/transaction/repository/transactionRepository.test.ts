// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { createSupabaseTransactionRepository } from "internal/transaction/repository/transactionRepository";
import { transactionErrorCodes } from "internal/transaction/errors";
import { appErrorToResponseBody } from "internal/shared/http/errorResponse";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  AuthenticationError,
  AuthorizationError,
  ConflictError,
  NotFoundError,
  RepositoryError,
  ValidationError,
} from "internal/shared/errors/appError";
describe("TransactionRepository", () => {
  const ledgerId = "00000000-0000-4000-8000-000000000032";
  const userId = "00000000-0000-4000-8000-000000000031";
  const transactionRecordId = "00000000-0000-4000-8000-000000009999";
  const accountId = "00000000-0000-4000-8000-000000000045";
  const targetAccountId = "00000000-0000-4000-8000-000000000046";
  const categoryId = "00000000-0000-4000-8000-000000005072";
  const transactionItemId = "00000000-0000-4000-8000-000000000201";
  const merchantId = "00000000-0000-4000-8000-000000001001";
  type QueryResult = {
    data: unknown;
    error: unknown | null;
  };
  function createQuery(result: QueryResult = { data: [], error: null }) {
    const query = {
      eq: vi.fn(),
      gte: vi.fn(),
      in: vi.fn(),
      is: vi.fn(),
      lt: vi.fn(),
      maybeSingle: vi.fn().mockResolvedValue(result),
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
    query.is.mockReturnValue(query);
    query.lt.mockReturnValue(query);
    query.order.mockReturnValue(query);
    query.range.mockReturnValue(query);
    query.select.mockReturnValue(query);
    return query;
  }
  function createRepository({
    queries = {},
    rpc = vi.fn().mockResolvedValue({ data: null, error: null }),
  }: {
    queries?: Record<string, ReturnType<typeof createQuery>>;
    rpc?: ReturnType<typeof vi.fn>;
  } = {}) {
    const logger = { error: vi.fn(), info: vi.fn(), warn: vi.fn() };
    const defaultQuery = createQuery();
    const from = vi.fn((table: string) => queries[table] ?? defaultQuery);
    const repository = createSupabaseTransactionRepository(
      { from, rpc } as never,
      logger,
    );
    return { defaultQuery, from, logger, repository, rpc };
  }
  const normalInput = {
    accountId,
    items: [{ amount: 1200, categoryId }],
    ledgerId,
    merchantId,
    note: null,
    transactionAt: "2026-06-04T01:00:00.000Z",
    type: "expense" as const,
  };
  const transferInput = {
    accountId,
    ledgerId,
    note: "转账",
    transactionAt: "2026-06-04T01:00:00.000Z",
    transferAmount: 1200,
    transferTargetAccountId: targetAccountId,
  };
  it("普通交易创建继续调用原子 RPC", async () => {
    const { repository, rpc } = createRepository();
    await repository.createNormal(normalInput);
    expect(rpc).toHaveBeenCalledWith("create_transaction", {
      p_account_id: accountId,
      p_items: [
        {
          ...normalInput.items[0],
          id: null,
          specialStatus: null,
        },
      ],
      p_ledger_id: ledgerId,
      p_merchant_id: merchantId,
      p_note: null,
      p_transaction_at: normalInput.transactionAt,
      p_type: "expense",
    });
  });
  it("退款收入将单一目标明细传给原子 RPC", async () => {
    const { repository, rpc } = createRepository();
    const refundedItemId = "00000000-0000-4000-8000-000000005073";

    await repository.createNormal({
      ...normalInput,
      items: [{ ...normalInput.items[0], refundedItemId }],
      type: "income",
    });

    expect(rpc).toHaveBeenCalledWith(
      "create_transaction",
      expect.objectContaining({
        p_items: [
          expect.objectContaining({
            refundedItemId,
          }),
        ],
      }),
    );
  });

  it("报销收入将单一目标明细传给原子 RPC", async () => {
    const { repository, rpc } = createRepository();
    const reimbursementItemId = "00000000-0000-4000-8000-000000005073";

    await repository.createNormal({
      ...normalInput,
      items: [{ ...normalInput.items[0], reimbursementItemId }],
      type: "income",
    });

    expect(rpc).toHaveBeenCalledWith(
      "create_transaction",
      expect.objectContaining({
        p_items: [
          expect.objectContaining({
            reimbursementItemId,
          }),
        ],
      }),
    );
  });

  it("转账创建映射原子 RPC 参数", async () => {
    const { repository, rpc } = createRepository();
    await repository.createTransfer(transferInput);
    expect(rpc).toHaveBeenCalledWith("create_transfer_transaction", {
      p_amount: 1200,
      p_from_account_id: accountId,
      p_ledger_id: ledgerId,
      p_note: "转账",
      p_to_account_id: targetAccountId,
      p_transaction_at: transferInput.transactionAt,
    });
  });
  it("退款收入更新将单一目标明细传给更新 RPC", async () => {
    const { repository, rpc } = createRepository();
    const refundedItemId = "00000000-0000-4000-8000-000000005073";

    await repository.updateNormal({
      ...normalInput,
      items: [{ ...normalInput.items[0], refundedItemId }],
      transactionRecordId,
      type: "income",
    });

    expect(rpc).toHaveBeenCalledWith(
      "update_transaction",
      expect.objectContaining({
        p_items: [
          expect.objectContaining({
            refundedItemId,
          }),
        ],
      }),
    );
  });

  it("普通交易和转账更新映射各自 RPC 参数", async () => {
    const { repository, rpc } = createRepository();
    await repository.updateNormal({
      ...normalInput,
      items: [{ ...normalInput.items[0], id: transactionItemId }],
      transactionRecordId,
    });
    await repository.updateTransfer({
      ...transferInput,
      transactionRecordId,
    });
    expect(rpc).toHaveBeenNthCalledWith(
      1,
      "update_transaction",
      expect.objectContaining({
        p_account_id: accountId,
        p_items: [
          {
            ...normalInput.items[0],
            id: transactionItemId,
            specialStatus: null,
          },
        ],
        p_ledger_id: ledgerId,
        p_transaction_record_id: transactionRecordId,
        p_type: "expense",
      }),
    );
    expect(rpc).toHaveBeenNthCalledWith(2, "update_transfer_transaction", {
      p_amount: 1200,
      p_from_account_id: accountId,
      p_ledger_id: ledgerId,
      p_note: "转账",
      p_to_account_id: targetAccountId,
      p_transaction_at: transferInput.transactionAt,
      p_transaction_record_id: transactionRecordId,
    });
  });
  it("普通交易和转账转换映射互斥 RPC 参数", async () => {
    const { repository, rpc } = createRepository();
    await repository.convert({
      ...normalInput,
      targetType: "income",
      transactionRecordId,
    });
    await repository.convert({
      ...transferInput,
      targetType: "transfer",
      transactionRecordId,
    });
    expect(rpc).toHaveBeenNthCalledWith(
      1,
      "convert_transaction_type_with_special_status",
      expect.objectContaining({
        p_account_id: accountId,
        p_from_account_id: null,
        p_target_type: "income",
        p_to_account_id: null,
        p_transfer_amount: null,
      }),
    );
    expect(rpc).toHaveBeenNthCalledWith(
      2,
      "convert_transaction_type_with_special_status",
      expect.objectContaining({
        p_account_id: null,
        p_from_account_id: accountId,
        p_items: null,
        p_target_type: "transfer",
        p_to_account_id: targetAccountId,
        p_transfer_amount: 1200,
      }),
    );
  });
  it("作废交易映射账本和交易 ID", async () => {
    const { repository, rpc } = createRepository();
    await repository.void(ledgerId, transactionRecordId);
    expect(rpc).toHaveBeenCalledWith("void_transaction", {
      p_ledger_id: ledgerId,
      p_transaction_record_id: transactionRecordId,
    });
  });
  it("分组摘要完整映射筛选和分页参数", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: [
        {
          balance: "800",
          expense: "200",
          group_id: merchantId,
          group_key: merchantId,
          group_label: "便利店",
          income: "1000",
          latest_transaction_at: normalInput.transactionAt,
          transaction_count: 2,
        },
      ],
      error: null,
    });
    const { repository } = createRepository({ rpc });
    const result = await repository.loadGroupSummaries({
      accountId,
      categoryId,
      dateEnd: "2026-07-01T00:00:00.000Z",
      dateStart: "2026-06-01T00:00:00.000Z",
      groupBy: "merchant",
      ledgerId,
      limit: 20,
      memberId: userId,
      merchantId,
      offset: 20,
      parentCategoryId: categoryId,
      recordType: "expense",
    });
    expect(result).toHaveLength(1);
    expect(rpc).toHaveBeenCalledWith(
      "load_transaction_group_summaries_with_special_status",
      {
        p_account_id: accountId,
        p_category_id: categoryId,
        p_date_end: "2026-07-01T00:00:00.000Z",
        p_date_start: "2026-06-01T00:00:00.000Z",
        p_group_by: "merchant",
        p_ledger_id: ledgerId,
        p_limit: 20,
        p_member_id: userId,
        p_merchant_id: merchantId,
        p_offset: 20,
        p_parent_category_id: categoryId,
        p_record_type: "expense",
        p_special_statuses: undefined,
      },
    );
  });
  it("交易列表应用日期、类型、成员、商户筛选和分页", async () => {
    const record = {
      created_at: normalInput.transactionAt,
      created_by: userId,
      id: transactionRecordId,
      merchant_id: merchantId,
      note: null,
      transaction_at: normalInput.transactionAt,
      type: "normal",
    };
    const query = createQuery({ data: [record], error: null });
    const { repository } = createRepository({
      queries: { transaction_record: query },
    });
    const result = await repository.listRecords({
      dateEnd: "2026-07-01T00:00:00.000Z",
      dateStart: "2026-06-01T00:00:00.000Z",
      ledgerId,
      limit: 20,
      memberId: userId,
      merchantId,
      offset: 20,
      recordType: "expense",
    });
    expect(result).toEqual([record]);
    expect(query.gte).toHaveBeenCalledWith(
      "transaction_at",
      "2026-06-01T00:00:00.000Z",
    );
    expect(query.lt).toHaveBeenCalledWith(
      "transaction_at",
      "2026-07-01T00:00:00.000Z",
    );
    expect(query.eq).toHaveBeenCalledWith("type", "normal");
    expect(query.eq).toHaveBeenCalledWith("merchant_id", merchantId);
    expect(query.eq).toHaveBeenCalledWith("created_by", userId);
    expect(query.range).toHaveBeenCalledWith(20, 39);
  });
  it("交易列表对未知商户和成员分组使用空值筛选", async () => {
    const merchantQuery = createQuery();
    const memberQuery = createQuery();
    const from = vi
      .fn()
      .mockReturnValueOnce(merchantQuery)
      .mockReturnValueOnce(memberQuery);
    const logger = { error: vi.fn(), info: vi.fn(), warn: vi.fn() };
    const repository = createSupabaseTransactionRepository(
      { from, rpc: vi.fn() } as never,
      logger,
    );
    await repository.listRecords({
      groupKeyPushDown: { groupBy: "merchant", groupKey: "unknown" },
      ledgerId,
      recordType: "all",
    });
    await repository.listRecords({
      groupKeyPushDown: { groupBy: "member", groupKey: "unknown" },
      ledgerId,
      recordType: "all",
    });
    expect(merchantQuery.is).toHaveBeenCalledWith("merchant_id", null);
    expect(memberQuery.is).toHaveBeenCalledWith("created_by", null);
  });
  it("读取交易关联数据时限定账本并去重 ID", async () => {
    const memberQuery = createQuery({
      data: [{ user_id: userId }],
      error: null,
    });
    const itemQuery = createQuery({
      data: [
        {
          amount: 7930,
          balance_delta: -7930,
          refunded_amount: 120,
          reimbursement_amount: 80,
          transaction_record_id: transactionRecordId,
        },
      ],
      error: null,
    });
    const { repository } = createRepository({
      queries: {
        ledger_member: memberQuery,
        transaction_item_with_refund: itemQuery,
      },
    });
    await expect(repository.listActiveMemberIds(ledgerId)).resolves.toEqual([
      userId,
    ]);
    await expect(
      repository.listItems(ledgerId, [
        transactionRecordId,
        transactionRecordId,
      ]),
    ).resolves.toEqual([
      {
        amount: "7930",
        balance_delta: "-7930",
        refunded_amount: "120",
        reimbursement_amount: "80",
        transaction_record_id: transactionRecordId,
      },
    ]);
    expect(itemQuery.select).toHaveBeenCalledWith(
      "id, transaction_record_id, account_id, category_id, amount, business_net_amount, balance_delta, note, special_status, refunded_amount, reimbursement_amount, is_refund_income, is_reimbursement_income, has_refund_link, has_reimbursement_link",
    );
    expect(itemQuery.in).toHaveBeenCalledWith("transaction_record_id", [
      transactionRecordId,
    ]);
  });
  it("交易明细查询失败时记录日志并抛出安全仓储错误", async () => {
    const itemQuery = createQuery({
      data: null,
      error: { code: "database_failure", message: "raw database details" },
    });
    const { logger, repository } = createRepository({
      queries: { transaction_item_with_refund: itemQuery },
    });

    await expect(
      repository.listItems(ledgerId, [transactionRecordId]),
    ).rejects.toMatchObject({
      code: "transaction_items_load_failed",
      message: "交易明细加载失败，请稍后重试。",
      name: RepositoryError.name,
    });
    expect(logger.error).toHaveBeenCalledWith(
      "[transaction] failed to load transaction items",
      { databaseCode: "database_failure", ledgerId },
    );
  });
  it("常用分类通过一次 RPC 读取按月累计后的聚合计数", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: [{ category_id: categoryId, occurrence_count: "26" }],
      error: null,
    });
    const { repository } = createRepository({ rpc });

    await expect(
      repository.loadFrequentCategoryCounts({
        dateEnd: "2026-08-31T15:00:00.000Z",
        dateStart: "2026-07-31T15:00:00.000Z",
        ledgerId,
        minimumItemCount: 20,
      }),
    ).resolves.toEqual([{ categoryId, count: 26 }]);

    expect(rpc).toHaveBeenCalledOnce();
    expect(rpc).toHaveBeenCalledWith(
      "load_frequent_transaction_category_counts",
      {
        p_date_end: "2026-08-31T15:00:00.000Z",
        p_date_start: "2026-07-31T15:00:00.000Z",
        p_ledger_id: ledgerId,
        p_minimum_item_count: 20,
      },
    );
  });
  it("合并用户资料和账本成员显示设置", async () => {
    const userQuery = createQuery({
      data: [{ display_name: "系统昵称", id: userId }],
      error: null,
    });
    const settingQuery = createQuery({
      data: [
        {
          display_color: "jade",
          display_name: "账本昵称",
          user_id: userId,
        },
      ],
      error: null,
    });
    const { repository } = createRepository({
      queries: {
        app_user: userQuery,
        ledger_member_display_setting: settingQuery,
      },
    });
    await expect(
      repository.findUserSummaries(ledgerId, [userId, userId]),
    ).resolves.toEqual([
      {
        display_color: "jade",
        display_name: "账本昵称",
        id: userId,
      },
    ]);
    expect(userQuery.in).toHaveBeenCalledWith("id", [userId]);
    expect(settingQuery.eq).toHaveBeenCalledWith("ledger_id", ledgerId);
  });
  it("空关联 ID 不发起数据库查询", async () => {
    const { from, repository } = createRepository();
    await expect(repository.findUserSummaries(ledgerId, [])).resolves.toEqual(
      [],
    );
    await expect(repository.listItems(ledgerId, [])).resolves.toEqual([]);
    expect(from).not.toHaveBeenCalled();
  });
  it("RPC 权限错误只转换为安全应用错误", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: null,
      error: { details: "permission_denied", message: "database details" },
    });
    const { logger, repository } = createRepository({ rpc });
    await expect(
      repository.void(ledgerId, transactionRecordId),
    ).rejects.toMatchObject({
      code: "permission_denied",
      message: "没有权限执行此交易操作。",
    });
    expect(logger.error).toHaveBeenCalledOnce();
  });
  it.each([
    {
      expectedCode: transactionErrorCodes.reimbursementLinkInvalid,
      rpcCode: "reimbursement_item_invalid",
    },
    {
      expectedCode: transactionErrorCodes.reimbursementLinkInvalid,
      rpcCode: "reimbursement_income_invalid",
    },
    {
      expectedCode: transactionErrorCodes.updateInvalid,
      rpcCode: "linked_transaction_edit_forbidden",
    },
  ] as const)(
    "RPC 业务错误 $rpcCode 映射为 409 冲突",
    async ({ expectedCode, rpcCode }) => {
      const rpc = vi.fn().mockResolvedValue({
        data: null,
        error: {
          code: "P0001",
          details: rpcCode,
          message: "database details",
        },
      });
      const { repository } = createRepository({ rpc });
      try {
        await repository.createNormal(normalInput);
        throw new Error("预期抛出 ConflictError");
      } catch (error) {
        expect(error).toBeInstanceOf(ConflictError);
        expect(error).toMatchObject({
          code: expectedCode,
          name: ConflictError.name,
        });
        if (!(error instanceof ConflictError)) throw error;
        expect(appErrorToResponseBody(error)).toMatchObject({
          body: { error: { status: 409 } },
          status: 409,
        });
      }
    },
  );

  it("查询错误转换为安全应用错误", async () => {
    const query = createQuery({
      data: null,
      error: { code: "db_error", message: "database details" },
    });
    const { logger, repository } = createRepository({
      queries: { transaction_record: query },
    });
    await expect(
      repository.listRecords({ ledgerId, recordType: "all" }),
    ).rejects.toMatchObject({
      code: "transaction_records_load_failed",
      message: "交易记录加载失败，请稍后重试。",
    });
    expect(logger.error).toHaveBeenCalledOnce();
  });
  it("权限读取限定账本、有效状态与交易 ID", async () => {
    const record = {
      created_at: normalInput.transactionAt,
      created_by: userId,
      id: transactionRecordId,
      merchant_id: null,
      note: null,
      transaction_at: normalInput.transactionAt,
      type: "normal",
    };
    const query = createQuery({ data: record, error: null });
    const { repository } = createRepository({
      queries: { transaction_record: query },
    });
    await expect(
      repository.findActiveRecord(ledgerId, transactionRecordId),
    ).resolves.toMatchObject({ id: transactionRecordId, type: "normal" });
    expect(query.eq).toHaveBeenCalledWith("id", transactionRecordId);
    expect(query.eq).toHaveBeenCalledWith("ledger_id", ledgerId);
    expect(query.eq).toHaveBeenCalledWith("status", "active");
  });
});
describe("TransactionDashboardRepository", () => {
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
  type QueryResult = {
    data: unknown;
    error: unknown | null;
  };
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
        transaction_item_with_refund: createQuery({
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
      expectedLog:
        "[transaction] failed to load dashboard month category types",
      queries: {
        category: createQuery({
          data: null,
          error: { code: "category_error", message: "database details" },
        }),
        transaction_item_with_refund: createQuery({
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
  it("本月汇总只读取记录 ID、金额、分类 ID 与分类类型", async () => {
    const recordQuery = createQuery({
      data: [{ id: recordId }],
      error: null,
    });
    const itemQuery = createQuery({
      data: [
        {
          amount: 1200,
          business_net_amount: 1000,
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
      transaction_item_with_refund: itemQuery,
      transaction_record: recordQuery,
    });
    await expect(
      repository.loadDashboardMonthSource(dashboardMonthInput),
    ).resolves.toEqual({
      categories: [{ id: categoryId, type: "expense" }],
      items: [
        {
          amount: "1200",
          business_net_amount: "1000",
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
      "transaction_record_id, category_id, amount, business_net_amount",
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
      transaction_item_with_refund: itemQuery,
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
describe("TransactionRepository \u8D44\u6E90\u8FB9\u754C", () => {
  const migrationPath = path.join(
    process.cwd(),
    "supabase/migrations/20260630020000_drop_transaction_item_stat_type.sql",
  );
  const normalInput = {
    accountId: "00000000-0000-4000-8000-000000000045",
    items: [
      {
        amount: 1200,
        categoryId: "00000000-0000-4000-8000-000000005072",
      },
    ],
    ledgerId: "00000000-0000-4000-8000-000000000032",
    merchantId: "00000000-0000-4000-8000-000000001001",
    note: null,
    transactionAt: "2026-06-04T01:00:00.000Z",
    type: "expense" as const,
  };
  function readFunctionBody(functionName: string) {
    const migration = readFileSync(migrationPath, "utf8");
    const startMarker = `create or replace function public.${functionName}(`;
    const start = migration.indexOf(startMarker);
    if (start < 0)
      throw new Error(`${functionName} was not found in migration`);
    const end = migration.indexOf("\n$$;", start);
    if (end < 0) throw new Error(`${functionName} body was not terminated`);
    return migration.slice(start, end);
  }
  function createRepositoryWithRpcError({
    code,
    databaseError,
  }: {
    code: string;
    databaseError: string;
  }) {
    const rpc = vi.fn().mockResolvedValue({
      data: null,
      error: {
        code,
        details: databaseError,
        message: `raw database message: ${databaseError}`,
      },
    });
    const logger = { error: vi.fn(), info: vi.fn(), warn: vi.fn() };
    const repository = createSupabaseTransactionRepository(
      { from: vi.fn(), rpc } as never,
      logger,
    );
    return { logger, repository };
  }
  /**
   * Transaction Service 负责认证、成员角色和交易创建者权限。
   * 跨资源归属、归档状态及组合完整性必须由事务型 RPC 在同一数据库事务内复核，
   * 避免在 Service 预查后产生 TOCTOU 窗口，也避免重复数据库往返。
   */
  describe("Transaction RPC 资源边界", () => {
    it.each(["create_transaction", "update_transaction"])(
      "%s 在事务内校验账户、商户和分类归属及归档状态",
      (functionName) => {
        const body = readFunctionBody(functionName);
        expect(body).toContain("a.ledger_id = p_ledger_id");
        expect(body).toContain("a.is_archived = false");
        expect(body).toContain("m.ledger_id = p_ledger_id");
        expect(body).toContain("m.is_archived = false");
        expect(body).toContain("c.ledger_id = p_ledger_id");
        expect(body).toContain("c.is_archived = false");
        expect(body).toContain("c.parent_id is not null");
        expect(body).toContain("c.type in ('expense', 'income')");
        expect(body).toContain("raise exception 'account_invalid'");
        expect(body).toContain("raise exception 'merchant_invalid'");
        expect(body).toContain("raise exception 'category_invalid'");
      },
    );
    it.each(["create_transfer_transaction", "update_transfer_transaction"])(
      "%s 在事务内校验转出与转入账户",
      (functionName) => {
        const body = readFunctionBody(functionName);
        expect(body).toContain("p_from_account_id = p_to_account_id");
        expect(body).toContain("a.ledger_id = p_ledger_id");
        expect(body).toContain("raise exception 'from_account_invalid'");
        expect(body).toContain("raise exception 'to_account_invalid'");
        expect(body).toContain(
          "v_from_account.currency <> v_to_account.currency",
        );
        expect(body).toContain("raise exception 'transfer_currency_invalid'");
      },
    );
    it("更新 RPC 将目标交易限定在当前账本且只允许 active 记录", () => {
      const normalBody = readFunctionBody("update_transaction");
      const transferBody = readFunctionBody("update_transfer_transaction");
      for (const body of [normalBody, transferBody]) {
        expect(body).toContain("tr.ledger_id = p_ledger_id");
        expect(body).toContain("tr.status = 'active'");
        expect(body).toContain("raise exception 'transaction_not_found'");
      }
    });
  });
  describe("Transaction Repository RPC 错误边界", () => {
    it.each([
      ["account_invalid", "account_invalid", "账户信息不正确，请确认后重试。"],
      [
        "from_account_invalid",
        "account_invalid",
        "账户信息不正确，请确认后重试。",
      ],
      [
        "to_account_invalid",
        "account_invalid",
        "账户信息不正确，请确认后重试。",
      ],
      [
        "transfer_currency_invalid",
        "account_invalid",
        "转账账户币种必须一致。",
      ],
      [
        "refund_currency_mismatch",
        transactionErrorCodes.refundLinkInvalid,
        "退款收入与支出明细的账户币种必须一致。",
      ],
      [
        "reimbursement_currency_mismatch",
        transactionErrorCodes.reimbursementLinkInvalid,
        "报销收入与待报销明细的账户币种必须一致。",
      ],
      [
        "income_link_category_invalid",
        "income_link_category_invalid",
        "只有收入明细才能关联报销或退款。",
      ],
      [
        "income_link_conflict",
        "income_link_conflict",
        "同一个收入明细不能同时作为退款来源和报销来源。",
      ],
      [
        "income_links_create_only",
        transactionErrorCodes.updateInvalid,
        "报销关联只能在新建收入交易时设置。",
      ],
      [
        "merchant_invalid",
        "merchant_invalid",
        "商家信息不正确，请确认后重试。",
      ],
      [
        "category_invalid",
        "category_invalid",
        "分类信息不正确，请确认后重试。",
      ],
    ])(
      "数据库参数错误 %s 转换为安全的 ValidationError",
      async (databaseError, expectedCode, expectedMessage) => {
        const { logger, repository } = createRepositoryWithRpcError({
          code: "22023",
          databaseError,
        });
        const error = await repository
          .createNormal(normalInput)
          .catch((value) => Promise.resolve(value));
        expect(error).toBeInstanceOf(ValidationError);
        expect(error).toMatchObject({
          code: expectedCode,
          message: expectedMessage,
        });
        if (!(error instanceof ValidationError)) throw error;
        expect(appErrorToResponseBody(error)).toMatchObject({
          body: { error: { status: 400 } },
          status: 400,
        });
        expect(String(error)).not.toContain("raw database message");
        expect(logger.error).toHaveBeenCalledWith(
          "[transaction] failed to create transaction",
          expect.objectContaining({
            databaseCode: "22023",
            databaseDetails: databaseError,
            databaseMessage: expect.stringContaining(databaseError),
          }),
        );
      },
    );
    it.each([
      "reimbursement_amount_mismatch",
      "refunded_item_special_status_conflict",
      "special_status_refund_conflict",
      "refund_amount_exceeded",
    ])("旧规则错误码 %s 不再映射为旧业务语义", async (databaseError) => {
      const { repository } = createRepositoryWithRpcError({
        code: "22023",
        databaseError,
      });
      await expect(repository.createNormal(normalInput)).rejects.toMatchObject({
        code: "transaction_invalid",
        message: "交易内容不正确，请确认后重试。",
      });
    });
    it("存在报销关联时退出报销流程转换为安全的 ConflictError", async () => {
      const { repository } = createRepositoryWithRpcError({
        code: "P0001",
        databaseError: "reimbursement_link_exists",
      });
      const error = await repository
        .createNormal(normalInput)
        .catch((value) => Promise.resolve(value));
      expect(error).toBeInstanceOf(ConflictError);
      expect(error).toMatchObject({
        code: transactionErrorCodes.reimbursementLinkInvalid,
        message: "该支出仍有关联的报销收入，请先解除关联。",
      });
      if (!(error instanceof ConflictError)) throw error;
      expect(appErrorToResponseBody(error)).toMatchObject({
        body: { error: { status: 409 } },
        status: 409,
      });
    });
    it("退款收入单目标唯一约束冲突（23505）转换为安全的 ConflictError", async () => {
      const { repository } = createRepositoryWithRpcError({
        code: "23505",
        databaseError:
          'duplicate key value violates unique constraint "transaction_item_refund_link_income_unique"',
      });
      const error = await repository
        .createNormal(normalInput)
        .catch((value) => Promise.resolve(value));
      expect(error).toBeInstanceOf(ConflictError);
      expect(error).toMatchObject({
        code: transactionErrorCodes.refundLinkInvalid,
        message: "同一退款收入最多只能关联一条支出明细，请刷新后重试。",
      });
      if (!(error instanceof ConflictError)) throw error;
      expect(appErrorToResponseBody(error)).toMatchObject({
        body: { error: { status: 409 } },
        status: 409,
      });
      expect(String(error)).not.toContain("transaction_item_refund_link");
    });
    it("退款关联 check 约束冲突（23514）转换为安全的 ValidationError", async () => {
      const { repository } = createRepositoryWithRpcError({
        code: "23514",
        databaseError:
          'new row for relation "transaction_item_refund_link" violates check constraint "transaction_item_refund_link_different_items_check"',
      });
      const error = await repository
        .createNormal(normalInput)
        .catch((value) => Promise.resolve(value));
      expect(error).toBeInstanceOf(ValidationError);
      expect(error).toMatchObject({
        code: transactionErrorCodes.refundLinkInvalid,
        message: "退款关联的金额或明细不正确，请确认后重试。",
      });
      if (!(error instanceof ValidationError)) throw error;
      expect(appErrorToResponseBody(error)).toMatchObject({
        body: { error: { status: 400 } },
        status: 400,
      });
      expect(String(error)).not.toContain("transaction_item_refund_link");
    });
    it.each([
      ["not_authenticated", "28000", AuthenticationError, "auth_required"],
      ["ledger_forbidden", "42501", AuthorizationError, "permission_denied"],
      ["permission_denied", "42501", AuthorizationError, "permission_denied"],
      [
        "transaction_not_found",
        "22023",
        NotFoundError,
        "transaction_not_found",
      ],
    ])(
      "数据库业务错误 %s 转换为对应应用错误",
      async (databaseError, databaseCode, ErrorType, expectedCode) => {
        const { repository } = createRepositoryWithRpcError({
          code: databaseCode,
          databaseError,
        });
        const error = await repository
          .createNormal(normalInput)
          .catch((value) => Promise.resolve(value));
        expect(error).toBeInstanceOf(ErrorType);
        expect(error).toMatchObject({ code: expectedCode });
        expect(String(error)).not.toContain("raw database message");
      },
    );
    it("未知数据库异常保留为安全的 RepositoryError", async () => {
      const { repository } = createRepositoryWithRpcError({
        code: "XX000",
        databaseError: "unexpected_database_failure",
      });
      const error = await repository
        .createNormal(normalInput)
        .catch((value) => Promise.resolve(value));
      expect(error).toBeInstanceOf(RepositoryError);
      expect(error).toMatchObject({
        code: "create_failed",
        message: "交易操作失败，请稍后重试。",
      });
      expect(String(error)).not.toContain("unexpected_database_failure");
    });
  });
});
