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
