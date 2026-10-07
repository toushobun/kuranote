import { describe, expect, it } from "vitest";

import { createLedgerSetupConfirmProgressFixture } from "test/mocks/ledgerSetup";

import { buildLedgerSetupConfirmSummary } from "./ledgerSetupSummary";

describe("buildLedgerSetupConfirmSummary", () => {
  it("汇总账户名、去重后的商家数与按标签排序的已选数量", () => {
    const summary = buildLedgerSetupConfirmSummary(
      createLedgerSetupConfirmProgressFixture(),
    );

    expect(summary.accounts).toEqual({
      names: ["现金", "楽天銀行"],
      skipped: false,
    });
    // Apple、Amazon 分别属于两个标签，只算一次。
    expect(summary.merchants.count).toBe(5);
    expect(
      summary.merchants.tags.map(({ key, count }) => [key, count]),
    ).toEqual([
      ["supermarket", 2],
      ["restaurant", 1],
      ["electronics", 1],
      ["ecommerce", 1],
      ["subscription", 2],
    ]);
    expect(summary.basicInfo.currencyLabel).toBe("JPY 日元");
    expect(summary.specialStatusEnabled).toBe(true);
  });

  it("跳过或数量为 0 时视为已跳过", () => {
    const summary = buildLedgerSetupConfirmSummary(
      createLedgerSetupConfirmProgressFixture({
        accounts: { items: [{ name: "现金", type: "cash" }], skipped: true },
        merchants: { selectedKeys: [], skipped: false },
      }),
    );

    expect(summary.accounts).toEqual({ names: [], skipped: true });
    expect(summary.merchants).toEqual({ count: 0, skipped: true, tags: [] });
  });

  it("无模板币种时商家视为已跳过", () => {
    const summary = buildLedgerSetupConfirmSummary(
      createLedgerSetupConfirmProgressFixture({}, null),
    );

    expect(summary.merchants.count).toBe(0);
    expect(summary.merchants.skipped).toBe(true);
  });
});
