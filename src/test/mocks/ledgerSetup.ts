import type { LedgerSetup } from "internal/ledger";
import type { LedgerSetupProgress } from "types/ledgers";

export const ledgerSetupFixtureId = "00000000-0000-4000-8000-000000000001";

/** 创建账本向导测试共用的创建中账本进度。草稿只保留测试需要的最小内容。 */
export function createLedgerSetupProgressFixture(
  overrides: Partial<LedgerSetup> = {},
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
    template: null,
  };
}
