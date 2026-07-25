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

  it.each([
    "update_transaction",
    "update_transfer_transaction",
    "convert_transaction_type",
    "void_transaction",
  ])("交易变更 RPC %s 只锁定目标账本内的 active 记录", (functionName) => {
    const functionSql = getFunctionSql(functionName);

    expect(functionSql).toContain("tr.id = p_transaction_record_id");
    expect(functionSql).toContain("tr.ledger_id = p_ledger_id");
    expect(functionSql).toContain("tr.status = 'active'");
  });

  it("普通记账 RPC 限制账户、商家和分类属于目标账本", () => {
    for (const functionName of ["create_transaction", "update_transaction"]) {
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

  it("标签同步只读取和写入目标账本内的标签及关联", () => {
    const functionSql = getFunctionSql("sync_transaction_record_tags");

    expect(functionSql).toContain("trt.ledger_id = p_ledger_id");
    expect(functionSql).toContain("tt.ledger_id = p_ledger_id");
    expect(functionSql).toContain("p_ledger_id,");
    expect(functionSql).toContain("p_transaction_record_id");
  });

  it("非时间维度交易分组 RPC 只读取 active 成员可访问的目标账本", () => {
    const functionSql = getFunctionSql("load_transaction_group_summaries");

    expect(functionSql).toContain("tr.ledger_id = p_ledger_id");
    expect(functionSql).toContain(
      "current_user_is_active_ledger_member(p_ledger_id)",
    );
    expect(functionSql).toContain("ti.ledger_id = p_ledger_id");
    expect(functionSql).toContain("trt.ledger_id = p_ledger_id");
  });

  it.each([
    ["account", "account_require_management_permission"],
    ["category", "category_require_management_permission"],
    ["merchant", "merchant_require_management_permission"],
    ["transaction_tag", "transaction_tag_require_management_permission"],
  ])("基础数据表 %s 的写入由管理权限 trigger 兜底", (table, trigger) => {
    expect(permissionMigrationSql).toContain(
      `create trigger ${trigger}\nbefore insert or update or delete on public.${table}\nfor each row execute function public.enforce_ledger_management_permission('ledger_id');`,
    );
  });

  it.each([
    ["transaction_record", "transaction_record_require_write_permission"],
    ["transaction_item", "transaction_item_require_write_permission"],
    [
      "transaction_record_tag",
      "transaction_record_tag_require_write_permission",
    ],
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
