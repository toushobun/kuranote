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
  it("关联编辑按 ledger → record → 明细 → 账户加锁，账户锁在记录级付款明细替换中按 id 一次性取得", () => {
    const editSql = getFunctionSql("update_linked_transaction_edit");
    const ledgerLockIndex = editSql.indexOf("from public.ledger ledger_row");
    const recordLockIndex = editSql.indexOf(
      "from public.transaction_record tr",
      ledgerLockIndex,
    );
    const itemIndex = editSql.indexOf("public.update_linked_transaction_item(");
    const paymentIndex = editSql.indexOf(
      "public.replace_transaction_payments(",
    );

    expect(ledgerLockIndex).toBeGreaterThanOrEqual(0);
    expect(recordLockIndex).toBeGreaterThan(ledgerLockIndex);
    expect(itemIndex).toBeGreaterThan(recordLockIndex);
    expect(paymentIndex).toBeGreaterThan(itemIndex);

    // #911：明细级 RPC 不再锁账户，余额只由付款明细替换处理。
    expect(getFunctionSql("update_linked_transaction_item")).not.toContain(
      "public.account",
    );

    const replaceSql = getFunctionSql("replace_transaction_payments");
    const accountLockIndex = replaceSql.indexOf("from public.account a");
    const accountOrderIndex = replaceSql.indexOf("order by a.id");
    const balanceIndex = replaceSql.indexOf("apply_account_balance_delta(");
    expect(replaceSql).toContain("v_old_account_ids || v_new_account_ids");
    expect(accountLockIndex).toBeGreaterThanOrEqual(0);
    expect(accountOrderIndex).toBeGreaterThan(accountLockIndex);
    expect(replaceSql).toContain("for no key update");
    expect(balanceIndex).toBeGreaterThan(accountOrderIndex);
  });
});
