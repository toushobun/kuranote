import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function readSource(relativePath: string) {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

function countOccurrences(source: string, value: string) {
  return source.split(value).length - 1;
}

const dashboardSource = readSource("src/server/loaders/dashboard.ts");
const accountsSource = readSource("src/server/loaders/accounts.ts");
const categoriesSource = readSource("src/server/loaders/categories.ts");
const merchantsSource = readSource("src/server/loaders/merchants.ts");
const statisticsSource = readSource("src/server/loaders/statistics.ts");
const transactionFormSource = readSource(
  "src/server/loaders/transactionForm.ts",
);
const categorySummarySource = readSource(
  "src/server/loaders/loadCategoriesByIdsWithParents.ts",
);

describe("核心 Loader current ledger 边界", () => {
  it("Dashboard 的记录、明细、账户和商家查询全部限定当前账本", () => {
    expect(dashboardSource).toContain("await getCurrentLedgerContext()");
    expect(
      countOccurrences(dashboardSource, '.eq("ledger_id", currentLedger.id)'),
    ).toBeGreaterThanOrEqual(7);
    expect(dashboardSource).toContain(
      "loadCategoriesByIdsWithParents(categoryIds, currentLedger.id)",
    );
  });

  it("账户页的账户、成员、显示设置和持有人查询全部限定当前账本", () => {
    expect(accountsSource).toContain("await getCurrentLedgerOrRedirect()");
    expect(
      countOccurrences(accountsSource, '.eq("ledger_id", currentLedger.id)'),
    ).toBeGreaterThanOrEqual(4);
    expect(accountsSource).toContain("ledgerId: currentLedger.id");
  });

  it("分类页只加载当前账本分类", () => {
    expect(categoriesSource).toContain("await getCurrentLedgerOrRedirect()");
    expect(categoriesSource).toContain('.eq("ledger_id", currentLedger.id)');
  });

  it("商家页先限定当前账本商家，再以其 ID 集合加载别名", () => {
    expect(merchantsSource).toContain("await getCurrentLedgerOrRedirect()");
    expect(merchantsSource).toContain('.eq("ledger_id", currentLedger.id)');
    expect(merchantsSource).toContain('.in("merchant_id", merchantIds)');
  });

  it("统计页的记录、明细、商家和分类均使用当前账本边界", () => {
    expect(statisticsSource).toContain("await getCurrentLedgerOrRedirect()");
    expect(
      countOccurrences(statisticsSource, '.eq("ledger_id", currentLedger.id)'),
    ).toBeGreaterThanOrEqual(3);
    expect(statisticsSource).toContain(
      "loadCategoriesByIdsWithParents(categoryIds, currentLedger.id)",
    );
  });

  it("记账编辑和候选数据均限定服务端 current ledger", () => {
    expect(transactionFormSource).toContain(
      "await getCurrentLedgerOrRedirect()",
    );
    expect(
      countOccurrences(
        transactionFormSource,
        '.eq("ledger_id", currentLedger.id)',
      ),
    ).toBeGreaterThanOrEqual(4);
    expect(
      countOccurrences(transactionFormSource, '.eq("ledger_id", ledgerId)'),
    ).toBeGreaterThanOrEqual(5);
  });

  it("分类摘要及其父分类均限定调用方验证后的账本", () => {
    expect(
      countOccurrences(categorySummarySource, '.eq("ledger_id", ledgerId)'),
    ).toBe(2);
  });
});
