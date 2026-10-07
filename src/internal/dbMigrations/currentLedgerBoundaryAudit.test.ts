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
  if (functionName === "convert_transaction_type") {
    return getFunctionSql("convert_transaction_type_locked_impl");
  }
  if (functionName === "void_transaction") {
    return getFunctionSql("void_transaction_locked_impl");
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

  it("convert_transaction_type 在进入 record/account 实现前先锁目标账本", () => {
    const functionSql = getFunctionSql("convert_transaction_type");
    const ledgerLockIndex = functionSql.indexOf(
      "from public.ledger ledger_row",
    );
    const implementationIndex = functionSql.indexOf(
      "convert_transaction_type_locked_impl(",
    );

    expect(ledgerLockIndex).toBeGreaterThanOrEqual(0);
    expect(functionSql).toContain("where ledger_row.id = p_ledger_id");
    expect(functionSql).toContain("for update");
    expect(implementationIndex).toBeGreaterThan(ledgerLockIndex);
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
      expect(getTransactionMutationImplementationSql(functionName)).toContain(
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

describe("创建中账本数据边界", () => {
  const smokeSql = readFileSync(
    join(process.cwd(), "scripts/security-definer-smoke.sql"),
    "utf8",
  );

  it("ledger 记录创建状态、步骤与草稿，并约束状态一致", () => {
    expect(schemaSql).toContain(
      `"setup_status" "text" DEFAULT 'completed'::"text" NOT NULL`,
    );
    expect(schemaSql).toContain(`"setup_step" smallint`);
    expect(schemaSql).toContain(`"setup_draft" "jsonb"`);
    expect(schemaSql).toContain(`CONSTRAINT "ledger_setup_status_check"`);
    expect(schemaSql).toContain(`CONSTRAINT "ledger_setup_state_check"`);
    expect(schemaSql).toContain(`"public"."ledger_setup_draft_max_bytes"()`);
  });

  it("每个用户最多一个未归档的创建中账本", () => {
    expect(schemaSql).toContain(
      `CREATE UNIQUE INDEX "ledger_owner_in_progress_setup_key" ON "public"."ledger" USING "btree" ("owner_user_id") WHERE (("setup_status" = 'in_progress'::"text") AND (NOT "is_archived"));`,
    );
  });

  it("current ledger 不能指向创建中账本", () => {
    expect(getFunctionSql("validate_app_user_current_ledger")).toContain(
      "l.setup_status = 'completed'",
    );
  });

  it.each(["current_user_can_manage_ledger", "current_user_can_write_ledger"])(
    "业务权限函数 %s 只对已完成创建的账本放行",
    (functionName) => {
      expect(getFunctionSql(functionName)).toContain(
        "public.ledger_setup_is_completed(p_ledger_id)",
      );
    },
  );

  it.each([
    "create_ledger_invite_v2",
    "list_pending_ledger_invites",
    "revoke_ledger_invite",
    "lock_ledger_placeholder_management",
    "create_merchant_tag",
    "create_merchant_with_tags",
    "enforce_ledger_management_permission",
  ])("邀请 / 待邀请成员 / 基础数据入口 %s 经过业务管理权限函数", (name) => {
    expect(getFunctionSql(name)).toContain("current_user_can_manage_ledger(");
  });

  it("账本列表 RPC 排除创建中账本", () => {
    expect(getFunctionSql("list_current_user_ledger_display_names")).toContain(
      "l.setup_status = 'completed'",
    );
  });

  it("创建中账本只创建账本、owner 成员与成员设置，不初始化默认数据也不切换当前账本", () => {
    const functionSql = getFunctionSql("create_ledger_setup");

    expect(functionSql).toContain("'in_progress'");
    expect(functionSql).toContain("public.bootstrap_ledger_owner_member(");
    expect(functionSql).toContain(
      "public.upsert_ledger_member_display_setting(",
    );
    expect(functionSql).toContain("ledger_setup_in_progress_exists");
    expect(functionSql).not.toContain("initialize_ledger_default_data");
    expect(functionSql).not.toContain("current_ledger_id");
  });

  it("既有账本创建流程不写创建状态，沿用默认值 completed", () => {
    expect(getFunctionSql("create_ledger_with_owner")).not.toContain(
      "setup_status",
    );
    expect(getFunctionSql("create_ledger_with_owner_settings")).not.toContain(
      "setup_status",
    );
  });

  it("创建状态列只能由向导 RPC 在事务内放行后修改", () => {
    const guardSql = getFunctionSql("guard_ledger_setup_state");

    expect(guardSql).toContain("app.allow_ledger_setup_update");
    expect(guardSql).toContain("old.setup_status = 'completed'");
    expect(schemaSql).toContain(
      `CREATE OR REPLACE TRIGGER "ledger_guard_setup_state" BEFORE UPDATE OF "setup_status", "setup_step", "setup_draft" ON "public"."ledger"`,
    );

    for (const functionName of [
      "save_ledger_setup_draft",
      "update_ledger_setup_basic_info",
    ]) {
      const functionSql = getFunctionSql(functionName);

      expect(functionSql).toContain(
        "public.lock_current_user_setup_ledger(p_ledger_id)",
      );
      expect(functionSql).toContain(
        "set_config('app.allow_ledger_setup_update', 'false', true)",
      );
    }
  });

  it("向导 RPC 只授权给 authenticated，内部函数不对客户端开放", () => {
    for (const signature of [
      `"create_ledger_setup"("p_name" "text", "p_base_currency" "text", "p_display_name" "text", "p_display_color" "text")`,
      `"save_ledger_setup_draft"("p_ledger_id" "uuid", "p_step" integer, "p_draft" "jsonb")`,
      `"get_current_user_setup_ledger"()`,
      `"complete_ledger_setup"("p_ledger_id" "uuid", "p_payload" "jsonb")`,
    ]) {
      expect(schemaSql).toContain(
        `GRANT ALL ON FUNCTION "public".${signature} TO "authenticated";`,
      );
      expect(schemaSql).not.toContain(
        `GRANT ALL ON FUNCTION "public".${signature} TO "anon";`,
      );
    }

    for (const signature of [
      `"ledger_setup_is_completed"("p_ledger_id" "uuid")`,
      `"lock_current_user_setup_ledger"("p_ledger_id" "uuid")`,
      `"ledger_setup_completion_allows_insert"("p_ledger_id" "uuid")`,
      `"validate_ledger_setup_completion_payload"("p_payload" "jsonb")`,
      `"validate_ledger_basic_info"("p_name" "text", "p_base_currency" "text", "p_display_name" "text", "p_display_color" "text")`,
      `"bootstrap_ledger_owner_member"("p_ledger_id" "uuid", "p_user_id" "uuid")`,
      `"upsert_ledger_member_display_setting"("p_ledger_id" "uuid", "p_user_id" "uuid", "p_display_name" "text", "p_display_color" "text")`,
      `"initialize_ledger_default_categories"("p_ledger_id" "uuid", "p_user_id" "uuid")`,
    ]) {
      expect(schemaSql).not.toContain(
        `GRANT ALL ON FUNCTION "public".${signature} TO "authenticated";`,
      );
    }
  });

  it("完成写入 RPC 校验 owner 与创建中状态，事务内放行写入后立即关闭", () => {
    const functionSql = getFunctionSql("complete_ledger_setup");
    const lockIndex = functionSql.indexOf(
      "public.lock_current_user_setup_ledger(p_ledger_id)",
    );
    const validateIndex = functionSql.indexOf(
      "public.validate_ledger_setup_completion_payload(p_payload)",
    );
    const openIndex = functionSql.indexOf(
      "set_config('app.ledger_setup_completion_ledger_id', p_ledger_id::text, true)",
    );
    const categoriesIndex = functionSql.indexOf(
      "public.initialize_ledger_default_categories(p_ledger_id, v_user_id)",
    );
    const closeIndex = functionSql.indexOf(
      "set_config('app.ledger_setup_completion_ledger_id', '', true)",
    );
    const completedIndex = functionSql.indexOf("setup_status = 'completed'");

    expect(lockIndex).toBeGreaterThan(-1);
    expect(validateIndex).toBeGreaterThan(lockIndex);
    expect(openIndex).toBeGreaterThan(validateIndex);
    expect(categoriesIndex).toBeGreaterThan(openIndex);
    expect(closeIndex).toBeGreaterThan(categoriesIndex);
    expect(completedIndex).toBeGreaterThan(closeIndex);
    expect(functionSql).toContain("current_ledger_id = p_ledger_id");
  });

  it("完成写入放行只适用于 INSERT 与当前用户自己的创建中账本", () => {
    const allowSql = getFunctionSql("ledger_setup_completion_allows_insert");

    expect(allowSql).toContain(
      "current_setting('app.ledger_setup_completion_ledger_id', true)",
    );
    expect(allowSql).toContain("l.owner_user_id = auth.uid()");
    expect(allowSql).toContain("l.setup_status = 'in_progress'");

    for (const name of [
      "enforce_ledger_management_permission",
      "enforce_merchant_alias_management_permission",
      "enforce_merchant_tag_link_management_permission",
    ]) {
      const functionSql = getFunctionSql(name);

      expect(functionSql).toContain("tg_op = 'INSERT'");
      expect(functionSql).toContain(
        "public.ledger_setup_completion_allows_insert(v_ledger_id)",
      );
      expect(functionSql).toContain("current_user_can_manage_ledger(");
    }
  });

  it("数据库烟雾测试覆盖创建中账本的 RPC 与边界", () => {
    expect(smokeSql).toContain("\\ir security-definer-smoke-issue-395.sql");
  });
});
