// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

import { createSupabaseTransactionRepository } from "internal/transaction/repository/transactionRepository";

const ledgerId = "00000000-0000-4000-8000-000000000032";
const userId = "00000000-0000-4000-8000-000000000031";
const transactionRecordId = "00000000-0000-4000-8000-000000009999";
const accountId = "00000000-0000-4000-8000-000000000045";
const targetAccountId = "00000000-0000-4000-8000-000000000046";
const categoryId = "00000000-0000-4000-8000-000000005072";
const merchantId = "00000000-0000-4000-8000-000000001001";
const tagId = "00000000-0000-4000-8000-000000003001";

type QueryResult = { data: unknown; error: unknown | null };

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
  tagNames: ["日常"],
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

describe("TransactionRepository", () => {
  it("普通交易创建继续调用原子 RPC", async () => {
    const { repository, rpc } = createRepository();
    await repository.createNormal(normalInput);
    expect(rpc).toHaveBeenCalledWith("create_transaction", {
      p_account_id: accountId,
      p_items: normalInput.items,
      p_ledger_id: ledgerId,
      p_merchant_id: merchantId,
      p_note: null,
      p_tag_names: ["日常"],
      p_transaction_at: normalInput.transactionAt,
      p_type: "expense",
    });
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

  it("普通交易和转账更新映射各自 RPC 参数", async () => {
    const { repository, rpc } = createRepository();
    await repository.updateNormal({ ...normalInput, transactionRecordId });
    await repository.updateTransfer({ ...transferInput, transactionRecordId });

    expect(rpc).toHaveBeenNthCalledWith(
      1,
      "update_transaction",
      expect.objectContaining({
        p_account_id: accountId,
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
      "convert_transaction_type",
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
      "convert_transaction_type",
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
      tagId,
    });

    expect(result).toHaveLength(1);
    expect(rpc).toHaveBeenCalledWith("load_transaction_group_summaries", {
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
      p_tag_id: tagId,
    });
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

  it("读取交易关联数据时限定账本、去重 ID 并保持排序", async () => {
    const memberQuery = createQuery({
      data: [{ user_id: userId }],
      error: null,
    });
    const activeTagQuery = createQuery({
      data: [{ color: null, id: tagId, name: "日常" }],
      error: null,
    });
    const itemQuery = createQuery({
      data: [{ amount: 1200, transaction_record_id: transactionRecordId }],
      error: null,
    });
    const assignmentQuery = createQuery({
      data: [{ tag_id: tagId, transaction_record_id: transactionRecordId }],
      error: null,
    });
    const tagByIdQuery = createQuery({
      data: [{ color: null, id: tagId, name: "日常" }],
      error: null,
    });
    const { repository } = createRepository({
      queries: {
        ledger_member: memberQuery,
        transaction_item: itemQuery,
        transaction_record_tag: assignmentQuery,
        transaction_tag: activeTagQuery,
      },
    });

    await expect(repository.listActiveMemberIds(ledgerId)).resolves.toEqual([
      userId,
    ]);
    await expect(repository.listActiveTags(ledgerId)).resolves.toHaveLength(1);
    await expect(
      repository.listItems(ledgerId, [
        transactionRecordId,
        transactionRecordId,
      ]),
    ).resolves.toHaveLength(1);
    await expect(
      repository.listTagAssignments(ledgerId, [transactionRecordId]),
    ).resolves.toHaveLength(1);

    const { repository: tagsRepository } = createRepository({
      queries: { transaction_tag: tagByIdQuery },
    });
    await expect(
      tagsRepository.listTagsByIds(ledgerId, [tagId, tagId]),
    ).resolves.toHaveLength(1);

    expect(itemQuery.in).toHaveBeenCalledWith("transaction_record_id", [
      transactionRecordId,
    ]);
    expect(assignmentQuery.order).toHaveBeenCalledWith("sort_order", {
      ascending: true,
    });
    expect(tagByIdQuery.in).toHaveBeenCalledWith("id", [tagId]);
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
    await expect(repository.listTagAssignments(ledgerId, [])).resolves.toEqual(
      [],
    );
    await expect(repository.listTagsByIds(ledgerId, [])).resolves.toEqual([]);
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
