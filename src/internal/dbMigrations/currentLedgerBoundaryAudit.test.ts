import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const schemaSql = readFileSync(
  join(process.cwd(), "supabase/schema_snapshot/current_schema.sql"),
  "utf8",
).replaceAll("\r\n", "\n");
const permissionMigrationSql = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260711180000_add_ledger_member_permission_model.sql",
  ),
  "utf8",
).replaceAll("\r\n", "\n");

function getFunctionSql(functionName: string) {
  const marker = `CREATE OR REPLACE FUNCTION "public"."${functionName}"`;
  const start = schemaSql.indexOf(marker);

  if (start < 0) {
    throw new Error(`Function not found in schema snapshot: ${functionName}`);
  }

  const end = schemaSql.indexOf("\nALTER FUNCTION", start);

  if (end < 0) {
    throw new Error(
      `Function end not found in schema snapshot: ${functionName}`,
    );
  }

  return schemaSql.slice(start, end);
}

function getTransactionMutationImplementationSql(functionName: string) {
  if (functionName === "create_transaction") {
    return getFunctionSql("create_transaction_locked_impl");
  }
  if (functionName === "update_transaction") {
    return getFunctionSql("update_transaction_locked_impl");
  }
  return getFunctionSql(functionName);
}

describe("current ledger 数据边界", () => {
  it("current ledger 只能指向用户 active 加入且未归档的账本", () => {
    const functionSql = getFunctionSql("validate_app_user_current_ledger");

    expect(functionSql).toContain("lm.user_id = new.id");
    expect(functionSql).toContain("lm.ledger_id = new.current_ledger_id");
    expect(functionSql).toContain("lm.status = 'active'");
    expect(functionSql).toContain("l.is_archived = false");
  });

  it("账本权限判断同时校验账本、登录用户、成员状态和用户状态", () => {
    const functionSql = getFunctionSql("current_user_has_ledger_role");

    expect(functionSql).toContain("lm.ledger_id = p_ledger_id");
    expect(functionSql).toContain("lm.user_id = auth.uid()");
    expect(functionSql).toContain("lm.status = 'active'");
    expect(functionSql).toContain("au.status = 'active'");
  });

  it.each([
    "create_transaction",
    "create_transfer_transaction",
    "update_transaction",
    "update_transfer_transaction",
    "convert_transaction_type",
    "void_transaction",
  ])("交易 RPC %s 重新校验目标账本写权限", (functionName) => {
    expect(getFunctionSql(functionName)).toContain(
      "current_user_can_write_ledger(p_ledger_id)",
    );
  });

  it("create_transaction 在整笔 payload 可能进入关联或特殊状态流程时先锁目标账本", () => {
    const functionSql = getFunctionSql("create_transaction");
    const lockGuardIndex = functionSql.indexOf("if v_requires_link_lock then");
    const ledgerLockIndex = functionSql.indexOf("from public.ledger l");

    expect(functionSql).toContain("jsonb_typeof(p_items) = 'array'");
    expect(functionSql).toContain("reimbursementItemId");
    expect(functionSql).toContain("refundedItemId");
    expect(functionSql).toContain("specialStatus");
    expect(lockGuardIndex).toBeGreaterThanOrEqual(0);
    expect(ledgerLockIndex).toBeGreaterThan(lockGuardIndex);
    expect(functionSql).toContain("where l.id = p_ledger_id");
    expect(functionSql).toContain("for update");
    expect(functionSql).toContain("create_transaction_locked_impl(");
  });

  it("update_transaction 仅在可能进入关联或特殊状态流程时先锁目标账本", () => {
    const functionSql = getFunctionSql("update_transaction");
    const lockGuardIndex = functionSql.indexOf("if v_requires_link_lock then");
    const ledgerLockIndex = functionSql.indexOf("from public.ledger l");

    expect(functionSql).toContain(
      "v_requires_link_lock boolean := p_type = 'income'",
    );
    expect(functionSql).toContain("jsonb_typeof(p_items) = 'array'");
    expect(functionSql).toContain("reimbursementItemId");
    expect(functionSql).toContain("refundedItemId");
    expect(functionSql).toContain("specialStatus");
    expect(lockGuardIndex).toBeGreaterThanOrEqual(0);
    expect(ledgerLockIndex).toBeGreaterThan(lockGuardIndex);
    expect(functionSql).toContain("where l.id = p_ledger_id");
    expect(functionSql).toContain("for update");
    expect(functionSql).toContain("update_transaction_locked_impl(");
  });

  it("update_transaction 原实现只允许 income 请求越过关联收入前置冻结并进入 clear 流程", () => {
    const functionSql = getFunctionSql("update_transaction_locked_impl");
    const incomeFlagIndex = functionSql.indexOf(
      "v_is_income_link_edit_request := p_type = 'income'",
    );
    const nonIncomeGuardIndex = functionSql.indexOf(
      "not v_is_income_link_edit_request",
    );
    const clearIndex = functionSql.indexOf(
      "clear_transaction_item_income_links(",
    );

    expect(incomeFlagIndex).toBeGreaterThanOrEqual(0);
    expect(nonIncomeGuardIndex).toBeGreaterThan(incomeFlagIndex);
    expect(clearIndex).toBeGreaterThan(nonIncomeGuardIndex);
    expect(functionSql).toContain("linked_transaction_edit_forbidden");
  });

  it.each([
    "update_transaction",
    "update_transfer_transaction",
    "convert_transaction_type",
    "void_transaction",
  ])("交易变更 RPC %s 只锁定目标账本内的 active 记录", (functionName) => {
    const functionSql = getTransactionMutationImplementationSql(functionName);

    expect(functionSql).toContain("tr.id = p_transaction_record_id");
    expect(functionSql).toContain("tr.ledger_id = p_ledger_id");
    expect(functionSql).toContain("tr.status = 'active'");
  });

  it("普通记账 RPC 限制账户、商家和分类属于目标账本", () => {
    for (const functionName of [
      "create_transaction_locked_impl",
      "update_transaction_locked_impl",
    ]) {
      const functionSql = getFunctionSql(functionName);

      expect(functionSql).toContain("a.ledger_id = p_ledger_id");
      expect(functionSql).toContain("m.ledger_id = p_ledger_id");
      expect(functionSql).toContain("c.ledger_id = p_ledger_id");
    }
  });

  it("转账和类型转换 RPC 只锁定目标账本内的账户", () => {
    for (const functionName of [
      "create_transfer_transaction",
      "update_transfer_transaction",
      "convert_transaction_type",
    ]) {
      expect(getFunctionSql(functionName)).toContain(
        "a.ledger_id = p_ledger_id",
      );
    }
  });

  it("非时间维度交易分组 RPC 只读取 active 成员可访问的目标账本", () => {
    const functionSql = getFunctionSql("load_transaction_group_summaries");

    expect(functionSql).toContain("tr.ledger_id = p_ledger_id");
    expect(functionSql).toContain(
      "current_user_is_active_ledger_member(p_ledger_id)",
    );
    expect(functionSql).toContain("ti.ledger_id = p_ledger_id");
    expect(functionSql).not.toContain("transaction_record_tag");
  });

  it.each([
    ["account", "account_require_management_permission"],
    ["category", "category_require_management_permission"],
    ["merchant", "merchant_require_management_permission"],
  ])("基础数据表 %s 的写入由管理权限 trigger 兜底", (table, trigger) => {
    expect(permissionMigrationSql).toContain(
      `create trigger ${trigger}\nbefore insert or update or delete on public.${table}\nfor each row execute function public.enforce_ledger_management_permission('ledger_id');`,
    );
  });

  it.each([
    ["transaction_record", "transaction_record_require_write_permission"],
    ["transaction_item", "transaction_item_require_write_permission"],
  ])("交易表 %s 的写入由交易权限 trigger 兜底", (table, trigger) => {
    const permissionFunction =
      table === "transaction_record"
        ? "enforce_transaction_record_permission()"
        : "enforce_transaction_child_permission()";

    expect(permissionMigrationSql).toContain(
      `create trigger ${trigger}\nbefore insert or update or delete on public.${table}\nfor each row execute function public.${permissionFunction};`,
    );
  });
});
