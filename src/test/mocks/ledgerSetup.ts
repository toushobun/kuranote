import type {
  LedgerSetup,
  LedgerSetupDraft,
  LedgerSetupTemplate,
} from "internal/ledger";
import type { LedgerSetupProgress } from "types/ledgers";

export const ledgerSetupFixtureId = "00000000-0000-4000-8000-000000000001";

/** 测试用的预设模板：只保留账户候选，商家为空。 */
export const ledgerSetupTemplateFixture: LedgerSetupTemplate = {
  region: "jp",
  accountCandidatesByRegion: {
    jp: {
      cash: ["日元现金"],
      bank: ["三菱UFJ銀行", "楽天銀行", "ゆうちょ銀行"],
      credit_card: ["楽天カード", "JCBカード"],
      e_money: ["PayPay", "Suica"],
    },
    cn: {
      cash: ["人民币现金"],
      bank: ["工商银行"],
      credit_card: ["工商银行信用卡"],
      e_money: ["支付宝", "微信支付"],
    },
  },
  merchantTags: [],
  merchants: [],
  version: 2,
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
      regions: ["jp"],
      aliases: [],
      key: "aeon",
      name: "イオン",
      tagKeys: ["supermarket"],
      websiteUrl: "https://www.aeon.com/",
    },
    {
      regions: ["jp"],
      aliases: [],
      key: "seiyu",
      name: "西友",
      tagKeys: ["supermarket"],
      websiteUrl: "https://www.seiyu.co.jp/",
    },
    {
      regions: ["jp"],
      aliases: [],
      key: "mcdonalds",
      name: "マクドナルド",
      tagKeys: ["restaurant"],
      websiteUrl: "https://www.mcdonalds.co.jp/",
    },
    {
      regions: ["jp"],
      aliases: [],
      key: "gusto",
      name: "ガスト",
      tagKeys: ["restaurant"],
      websiteUrl: "https://www.skylark.co.jp/gusto/",
    },
    {
      regions: ["jp"],
      aliases: [],
      key: "sukiya",
      name: "すき家",
      tagKeys: ["restaurant"],
      websiteUrl: "https://www.sukiya.jp/",
    },
    {
      regions: ["jp"],
      aliases: [],
      key: "apple",
      name: "Apple",
      tagKeys: ["electronics", "subscription"],
      websiteUrl: "https://www.apple.com/jp/",
    },
    {
      regions: ["jp"],
      aliases: [],
      key: "yodobashi",
      name: "ヨドバシカメラ",
      tagKeys: ["electronics"],
      websiteUrl: "https://www.yodobashi.com/",
    },
    {
      regions: ["jp"],
      aliases: [],
      key: "amazon",
      name: "Amazon",
      tagKeys: ["ecommerce", "subscription"],
      websiteUrl: "https://www.amazon.co.jp/",
    },
    {
      regions: ["jp"],
      aliases: [],
      key: "mercari",
      name: "メルカリ",
      tagKeys: ["ecommerce"],
      websiteUrl: "https://jp.mercari.com/",
    },
    {
      regions: ["jp"],
      aliases: [],
      key: "netflix",
      name: "Netflix",
      tagKeys: ["subscription"],
      websiteUrl: "https://www.netflix.com/jp/",
    },
    {
      regions: ["jp"],
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

/** 数据库默认分类中的大分类名称（按排序），与 get_ledger_default_root_categories 的返回一致。 */
export const ledgerSetupDefaultRootCategoryNamesFixture = [
  "💰 工资收入",
  "💸 其他收入",
  "🍽️ 饮食",
  "🏠 住房",
  "🚃 出行",
  "👗 穿衣",
  "🎮 玩耍",
  "💊 医疗",
  "📚 教育",
  "📱 通讯",
  "🤝 人情",
  "💴 金融",
];

/** 创建账本向导测试共用的创建中账本进度。草稿只保留测试需要的最小内容。 */
export function createLedgerSetupProgressFixture(
  overrides: Partial<LedgerSetup> = {},
  template: LedgerSetupTemplate | null = null,
): LedgerSetupProgress {
  return {
    setup: {
      baseCurrency: "JPY",
      livingRegion: "jp",
      displayColor: "amber",
      displayName: "淞文",
      draft: {
        accounts: {
          items: [{ name: "日元现金", templateKey: "日元现金", type: "cash" }],
          skipped: false,
        },
        features: {
          multiAccountPaymentEnabled: false,
          specialStatusEnabled: false,
        },
        merchants: { selectedKeys: [], skipped: false },
        schemaVersion: 2,
        templateRegion: "jp",
        templateVersion: 2,
      },

      id: ledgerSetupFixtureId,
      name: "家庭账本",
      step: 2,
      ...overrides,
    },
    template,
  };
}

type LedgerSetupDraftOverrides = {
  [Key in keyof LedgerSetupDraft]?: LedgerSetupDraft[Key];
};

/**
 * 停在第 5 步「确认一览」的进度：账户 2 个；商家 5 家（超市 2 家、餐饮 1 家，
 * Apple / Amazon 为多标签商家，去重后共 5 家）；功能开启。
 */
export function createLedgerSetupConfirmProgressFixture(
  draft: LedgerSetupDraftOverrides = {},
  template: LedgerSetupTemplate | null = ledgerSetupMerchantTemplateFixture,
) {
  const base = createLedgerSetupProgressFixture();
  return createLedgerSetupProgressFixture(
    {
      draft: {
        ...base.setup.draft,
        accounts: {
          items: [
            { name: "日元现金", templateKey: "日元现金", type: "cash" },
            { name: "楽天銀行", templateKey: "楽天銀行", type: "bank" },
          ],
          skipped: false,
        },
        features: {
          multiAccountPaymentEnabled: true,
          specialStatusEnabled: true,
        },
        // 超市 2 家、餐饮 1 家，Apple / Amazon 为多标签商家。
        merchants: {
          selectedKeys: ["aeon", "seiyu", "mcdonalds", "apple", "amazon"],
          skipped: false,
        },
        ...draft,
      },
      step: 5,
    },
    template,
  );
}
