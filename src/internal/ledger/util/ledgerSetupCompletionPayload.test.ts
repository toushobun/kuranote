import { describe, expect, it } from "vitest";

import { getLedgerSetupTemplate } from "internal/ledger/entity/ledgerSetupTemplate/ledgerSetupTemplate";
import { buildLedgerSetupCompletionPayload } from "internal/ledger/util/ledgerSetupCompletionPayload";
import {
  createDefaultLedgerSetupDraft,
  resolveLedgerSetupDraft,
} from "internal/ledger/util/ledgerSetupDraft";

const jpyTemplate = getLedgerSetupTemplate("JPY");
const jpyDraft = createDefaultLedgerSetupDraft("JPY");

describe("buildLedgerSetupCompletionPayload", () => {
  it("商家内容只取自代码模板，标签只创建被选中商家所属的标签", () => {
    const payload = buildLedgerSetupCompletionPayload(
      {
        ...jpyDraft,
        accounts: {
          items: [
            { name: "现金", type: "cash" },
            { name: " 楽天銀行 ", templateKey: "楽天銀行", type: "bank" },
          ],
          skipped: false,
        },
        features: { specialStatusEnabled: true },
        merchants: { selectedKeys: ["water_bureau", "amazon"], skipped: false },
      },
      jpyTemplate,
    );

    expect(payload).toEqual({
      accounts: [
        { name: "现金", type: "cash" },
        { name: "楽天銀行", type: "bank" },
      ],
      merchantTags: [
        { icon: "📦", key: "ecommerce", name: "电商" },
        { icon: "🎬", key: "subscription", name: "订阅服务" },
        { icon: "⚡", key: "utilities", name: "水电燃气" },
      ],
      merchants: [
        {
          aliases: [
            { alias: "亚马逊", locale: "zh" },
            { alias: "アマゾン", locale: "ja" },
            { alias: "Amazonプライム", locale: "ja" },
            { alias: "Prime Video", locale: "en" },
            { alias: "亚马逊Prime", locale: "zh" },
          ],
          name: "Amazon",
          tagKeys: ["ecommerce", "subscription"],
          websiteUrl: "https://www.amazon.co.jp/",
        },
        {
          aliases: [
            { alias: "自来水", locale: "zh" },
            { alias: "水道代", locale: "ja" },
            { alias: "上下水道", locale: "ja" },
          ],
          name: "水道局",
          tagKeys: ["utilities"],
          websiteUrl: null,
        },
      ],
      specialStatusEnabled: true,
    });
  });

  it("默认草稿写入现金账户与默认标签下的商家，多标签商家只出现一次", () => {
    const payload = buildLedgerSetupCompletionPayload(jpyDraft, jpyTemplate);
    const merchantNames = payload.merchants.map(({ name }) => name);

    expect(payload.accounts).toEqual([{ name: "现金", type: "cash" }]);
    expect(payload.merchants).toHaveLength(50);
    expect(new Set(merchantNames).size).toBe(merchantNames.length);
    expect(payload.merchantTags.map(({ name }) => name)).toEqual([
      "超市",
      "便利店",
      "餐饮",
      "咖啡甜品",
      "药妆店",
      "生活杂货",
      "电商",
      "通讯",
      "订阅服务",
    ]);
    expect(payload.specialStatusEnabled).toBe(false);
  });

  it("跳过账户与商家时不写入任何账户、商家与标签", () => {
    expect(
      buildLedgerSetupCompletionPayload(
        {
          ...jpyDraft,
          accounts: { ...jpyDraft.accounts, skipped: true },
          merchants: { ...jpyDraft.merchants, skipped: true },
        },
        jpyTemplate,
      ),
    ).toEqual({
      accounts: [],
      merchantTags: [],
      merchants: [],
      specialStatusEnabled: false,
    });
  });

  it("无模板币种只写入账户与功能开关", () => {
    expect(
      buildLedgerSetupCompletionPayload(
        createDefaultLedgerSetupDraft("USD"),
        null,
      ),
    ).toEqual({
      accounts: [{ name: "现金", type: "cash" }],
      merchantTags: [],
      merchants: [],
      specialStatusEnabled: false,
    });
  });

  it("草稿币种与账本货币不一致时，校正后的草稿不会写入旧币种商家", () => {
    const resolved = resolveLedgerSetupDraft(jpyDraft, "USD");

    expect(
      buildLedgerSetupCompletionPayload(
        resolved,
        getLedgerSetupTemplate("USD"),
      ),
    ).toMatchObject({ merchantTags: [], merchants: [] });
  });
});
