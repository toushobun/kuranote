import { describe, expect, it } from "vitest";
import { getLedgerSetupTemplate } from "internal/ledger/entity/ledgerSetupTemplate/getLedgerSetupTemplate";
import { createDefaultLedgerSetupDraft } from "./ledgerSetupDraft";
import { buildLedgerSetupCompletionPayload } from "./ledgerSetupCompletionPayload";
import { buildMerchantFaviconUrl } from "utils/merchants";
describe("buildLedgerSetupCompletionPayload", () => {
  const template = getLedgerSetupTemplate("jp")!;
  it("显示名中文优先，原名及各语言别名与全部分类一并写入", () => {
    const draft = createDefaultLedgerSetupDraft("jp");
    draft.merchants.selectedKeys = [
      "apple",
      "apple",
      "rakuten",
      "water_bureau",
    ];
    const payload = buildLedgerSetupCompletionPayload(draft, template);
    expect(payload.merchants).toHaveLength(3);
    const apple = payload.merchants.find((m) => m.name === "苹果")!;
    expect(apple.aliases).toEqual(
      expect.arrayContaining([
        { alias: "Apple", locale: "en" },
        { alias: "アップル", locale: "ja" },
      ]),
    );
    expect(apple.tagKeys).toEqual(["shopping"]);
    expect(payload.merchants.find((m) => m.name === "乐天")?.tagKeys).toEqual([
      "shopping",
      "living_expenses",
    ]);
    expect(payload.merchantTags.map((t) => t.key)).toEqual([
      "shopping",
      "living_expenses",
    ]);
    expect(payload.merchants.find((m) => m.name === "自来水")).toMatchObject({
      websiteUrl: null,
      iconUrl: null,
    });
  });
  it("两地全选共194家，每家只写入一次，头像复用官网规则", () => {
    const draft = createDefaultLedgerSetupDraft("jp");
    draft.merchants = {
      selectedKeys: template.merchants.map((m) => m.key),
      skipped: false,
      additionalRegions: ["cn"],
    };
    const payload = buildLedgerSetupCompletionPayload(draft, template);
    expect(payload.merchants).toHaveLength(194);
    expect(payload.merchantTags).toHaveLength(7);
    for (const merchant of payload.merchants)
      expect(merchant.iconUrl).toBe(
        buildMerchantFaviconUrl(merchant.websiteUrl),
      );
  });
  it("账户按候选所属地区的货币写入，与账本生活地区无关", () => {
    const draft = createDefaultLedgerSetupDraft("cn");
    draft.accounts.items = [
      { name: "人民币现金", templateKey: "人民币现金", type: "cash" },
      { name: "日元现金", templateKey: "日元现金", type: "cash" },
      { name: "PayPay", templateKey: "PayPay", type: "e_money" },
      { name: "支付宝", templateKey: "支付宝", type: "e_money" },
    ];
    expect(
      buildLedgerSetupCompletionPayload(draft, getLedgerSetupTemplate("cn"))
        .accounts,
    ).toEqual([
      { currency: "CNY", name: "人民币现金", type: "cash" },
      { currency: "JPY", name: "日元现金", type: "cash" },
      { currency: "JPY", name: "PayPay", type: "e_money" },
      { currency: "CNY", name: "支付宝", type: "e_money" },
    ]);
  });
  it("跳过时保留草稿但不写入账户商家和标签", () => {
    const draft = createDefaultLedgerSetupDraft("cn");
    draft.accounts.skipped = true;
    draft.merchants.skipped = true;
    expect(
      buildLedgerSetupCompletionPayload(draft, getLedgerSetupTemplate("cn")),
    ).toMatchObject({
      templateRegion: "cn",
      accounts: [],
      merchants: [],
      merchantTags: [],
    });
  });
});
