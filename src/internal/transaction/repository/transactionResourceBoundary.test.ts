// @vitest-environment node

import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it, vi } from "vitest";

import {
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  RepositoryError,
  ValidationError,
} from "internal/shared/errors/appError";
import { createSupabaseTransactionRepository } from "internal/transaction/repository/transactionRepository";

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
  tagNames: [],
  transactionAt: "2026-06-04T01:00:00.000Z",
  type: "expense" as const,
};

function readFunctionBody(functionName: string) {
  const migration = readFileSync(migrationPath, "utf8");
  const startMarker = `create or replace function public.${functionName}(`;
  const start = migration.indexOf(startMarker);
  if (start < 0) throw new Error(`${functionName} was not found in migration`);
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
    ["to_account_invalid", "account_invalid", "账户信息不正确，请确认后重试。"],
    ["transfer_currency_invalid", "account_invalid", "转账账户币种必须一致。"],
    ["merchant_invalid", "merchant_invalid", "商家信息不正确，请确认后重试。"],
    ["category_invalid", "category_invalid", "分类信息不正确，请确认后重试。"],
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
    ["not_authenticated", "28000", AuthenticationError, "auth_required"],
    ["ledger_forbidden", "42501", AuthorizationError, "permission_denied"],
    ["permission_denied", "42501", AuthorizationError, "permission_denied"],
    ["transaction_not_found", "22023", NotFoundError, "transaction_not_found"],
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
