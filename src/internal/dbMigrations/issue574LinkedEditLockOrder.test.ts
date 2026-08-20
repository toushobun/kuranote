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

describe("Issue #574 关联编辑锁顺序", () => {
  it("公开关联编辑先锁 ledger 和涉及交易记录，再进入 item/account 原子实现", () => {
    const functionSql = getFunctionSql("update_linked_transaction_item");
    const ledgerLockIndex = functionSql.indexOf(
      "from public.ledger ledger_row",
    );
    const recordLockIndex = functionSql.indexOf(
      "from public.transaction_record record_row",
    );
    const recordOrderIndex = functionSql.indexOf("order by record_row.id");
    const implementationIndex = functionSql.indexOf(
      "update_linked_transaction_item_locked_impl(",
    );

    expect(ledgerLockIndex).toBeGreaterThanOrEqual(0);
    expect(recordLockIndex).toBeGreaterThan(ledgerLockIndex);
    expect(recordOrderIndex).toBeGreaterThan(recordLockIndex);
    expect(implementationIndex).toBeGreaterThan(recordOrderIndex);
    expect(functionSql).toContain("for update");
    expect(functionSql).toContain("transaction_item_reimbursement_link");
    expect(functionSql).toContain("transaction_item_refund_link");
  });
});
