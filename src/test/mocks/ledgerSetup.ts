import type { LedgerSetup, LedgerSetupTemplate } from "internal/ledger";
import type { LedgerSetupProgress } from "types/ledgers";

export const ledgerSetupFixtureId = "00000000-0000-4000-8000-000000000001";

/** 测试用的预设模板：只保留账户候选，商家为空。 */
export const ledgerSetupTemplateFixture: LedgerSetupTemplate = {
  accountCandidates: {
    bank: ["三菱UFJ銀行", "楽天銀行", "ゆうちょ銀行"],
    credit_card: ["楽天カード", "JCBカード"],
    e_money: ["PayPay", "Suica"],
  },
  currency: "JPY",
  merchantTags: [],
  merchants: [],
  version: 1,
};

/**
 * 测试用的商家模板：从 JPY 模板中挑选的一部分。
 * 包含多标签商家（Apple、Amazon）、带路径的 URL（ガスト）与无 URL 的商家（病院），
 * 标签数组顺序与 sortOrder 不一致（用于验证按 sortOrder 排序）。
 */
export const ledgerSetupMerchantTemplateFixture: LedgerSetupTemplate = {
  ...ledgerSetupTemplateFixture,
  merchantTags: [
    {
      defaultSelected: true,
      icon: "🍽️",
      key: "restaurant",
      name: "餐饮",
      sortOrder: 2,
    },
    {
      defaultSelected: true,
      icon: "🛒",
      key: "supermarket",
      name: "超市",
      sortOrder: 0,
    },
    {
      defaultSelected: false,
      icon: "🔌",
      key: "electronics",
      name: "家电数码",
      sortOrder: 7,
    },
    {
      defaultSelected: true,
      icon: "📦",
      key: "ecommerce",
      name: "电商",
      sortOrder: 8,
    },
    {
      defaultSelected: false,
      icon: "🎬",
      key: "subscription",
      name: "订阅服务",
      sortOrder: 11,
    },
    {
      defaultSelected: false,
      icon: "🏛️",
      key: "public_service",
      name: "政府·公共服务",
      sortOrder: 13,
    },
  ],
  merchants: [
    {
      aliases: [],
      key: "aeon",
      name: "イオン",
      tagKeys: ["supermarket"],
      websiteUrl: "https://www.aeon.com/",
    },
    {
      aliases: [],
      key: "seiyu",
      name: "西友",
      tagKeys: ["supermarket"],
      websiteUrl: "https://www.seiyu.co.jp/",
    },
    {
      aliases: [],
      key: "mcdonalds",
      name: "マクドナルド",
      tagKeys: ["restaurant"],
      websiteUrl: "https://www.mcdonalds.co.jp/",
    },
    {
      aliases: [],
      key: "gusto",
      name: "ガスト",
      tagKeys: ["restaurant"],
      websiteUrl: "https://www.skylark.co.jp/gusto/",
    },
    {
      aliases: [],
      key: "sukiya",
      name: "すき家",
      tagKeys: ["restaurant"],
      websiteUrl: "https://www.sukiya.jp/",
    },
    {
      aliases: [],
      key: "apple",
      name: "Apple",
      tagKeys: ["electronics", "subscription"],
      websiteUrl: "https://www.apple.com/jp/",
    },
    {
      aliases: [],
      key: "yodobashi",
      name: "ヨドバシカメラ",
      tagKeys: ["electronics"],
      websiteUrl: "https://www.yodobashi.com/",
    },
    {
      aliases: [],
      key: "amazon",
      name: "Amazon",
      tagKeys: ["ecommerce", "subscription"],
      websiteUrl: "https://www.amazon.co.jp/",
    },
    {
      aliases: [],
      key: "mercari",
      name: "メルカリ",
      tagKeys: ["ecommerce"],
      websiteUrl: "https://jp.mercari.com/",
    },
    {
      aliases: [],
      key: "netflix",
      name: "Netflix",
      tagKeys: ["subscription"],
      websiteUrl: "https://www.netflix.com/jp/",
    },
    {
      aliases: [],
      key: "hospital",
      name: "病院",
      tagKeys: ["public_service"],
      websiteUrl: null,
    },
  ],
};

/** 商家模板 fixture 的默认勾选：默认勾选标签（超市、餐饮、电商）下的全部商家。 */
export const ledgerSetupMerchantDefaultSelectedKeys = [
  "aeon",
  "seiyu",
  "mcdonalds",
  "gusto",
  "sukiya",
  "amazon",
  "mercari",
];

/** 创建账本向导测试共用的创建中账本进度。草稿只保留测试需要的最小内容。 */
export function createLedgerSetupProgressFixture(
  overrides: Partial<LedgerSetup> = {},
  template: LedgerSetupTemplate | null = null,
): LedgerSetupProgress {
  return {
    setup: {
      baseCurrency: "JPY",
      displayColor: "amber",
      displayName: "淞文",
      draft: {
        accounts: { items: [{ name: "现金", type: "cash" }], skipped: false },
        features: { specialStatusEnabled: false },
        merchants: { selectedKeys: [], skipped: false },
        templateCurrency: "JPY",
        templateVersion: 1,
      },
      hasTemplateSelections: false,
      id: ledgerSetupFixtureId,
      name: "家庭账本",
      step: 2,
      ...overrides,
    },
    template,
  };
}
