// @vitest-environment node

import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it, vi } from "vitest";

import { createSupabaseTransactionRepository } from "server/transaction/repository/transactionRepository";

const migrationPath = path.join(
  process.cwd(),
  "supabase/migrations/20260630020000_drop_transaction_item_stat_type.sql",
);

function readFunctionBody(functionName: string) {
  const migration = readFileSync(migrationPath, "utf8");
  const startMarker = `create or replace function public.${functionName}(`;
  const start = migration.indexOf(startMarker);
  if (start < 0) throw new Error(`${functionName} was not found in migration`);
  const end = migration.indexOf("\n$$;", start);
  if (end < 0) throw new Error(`${functionName} body was not terminated`);
  return migration.slice(start, end);
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
      expect(body).toContain("v_from_account.currency <> v_to_account.currency");
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
    "account_invalid",
    "merchant_invalid",
    "category_invalid",
    "from_account_invalid",
    "to_account_invalid",
    "transfer_currency_invalid",
  ])("数据库资源错误 %s 不向上层泄露原始详情", async (databaseError) => {
    const rpc = vi.fn().mockResolvedValue({
      data: null,
      error: {
        details: databaseError,
        message: `raw database message: ${databaseError}`,
      },
    });
    const logger = { error: vi.fn(), info: vi.fn(), warn: vi.fn() };
    const repository = createSupabaseTransactionRepository(
      { from: vi.fn(), rpc } as never,
      logger,
    );

    await expect(
      repository.createNormal({
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
        type: "expense",
      }),
    ).rejects.toMatchObject({
      code: "create_failed",
      message: "交易操作失败，请稍后重试。",
    });

    expect(logger.error).toHaveBeenCalledWith(
      "[transaction] failed to create transaction",
      expect.objectContaining({
        databaseDetails: databaseError,
        databaseMessage: expect.stringContaining(databaseError),
      }),
    );
  });
});
