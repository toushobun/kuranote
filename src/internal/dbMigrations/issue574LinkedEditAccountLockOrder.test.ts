// @vitest-environment node

import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const schemaSql = readFileSync(
  path.join(process.cwd(), "supabase/schema_snapshot/current_schema.sql"),
  "utf8",
);

function getFunctionSql(functionName: string) {
  const marker = `CREATE OR REPLACE FUNCTION "public"."${functionName}"`;
  const start = schemaSql.indexOf(marker);
  if (start < 0) throw new Error(`未找到函数：${functionName}`);
  const end = schemaSql.indexOf("\n\nALTER FUNCTION ", start);
  if (end < 0) throw new Error(`未找到函数结束位置：${functionName}`);
  return schemaSql.slice(start, end);
}

describe("Issue #574 关联编辑账户锁顺序", () => {
  it("关联编辑在进入 item 原子实现前按账户 id 锁定旧账户和新账户", () => {
    const functionSql = getFunctionSql("update_linked_transaction_item");
    const ledgerLockIndex = functionSql.indexOf(
      "from public.ledger ledger_row",
    );
    const recordLockIndex = functionSql.indexOf(
      "from public.transaction_record record_row",
    );
    const accountLockIndex = functionSql.indexOf(
      "from public.account account_row",
    );
    const accountOrderIndex = functionSql.indexOf("order by account_row.id");
    const implementationIndex = functionSql.indexOf(
      "update_linked_transaction_item_locked_impl(",
    );

    expect(ledgerLockIndex).toBeGreaterThanOrEqual(0);
    expect(recordLockIndex).toBeGreaterThan(ledgerLockIndex);
    expect(accountLockIndex).toBeGreaterThan(recordLockIndex);
    expect(accountOrderIndex).toBeGreaterThan(accountLockIndex);
    expect(implementationIndex).toBeGreaterThan(accountOrderIndex);
    expect(functionSql).toContain(
      "array[v_old_account_id, p_account_id]::uuid[]",
    );
    expect(functionSql).toContain("for update");
  });
});
