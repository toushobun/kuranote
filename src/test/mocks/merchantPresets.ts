import { getLedgerSetupTemplate } from "internal/ledger";
import type { MerchantPresetOptions } from "internal/merchant";

/** 测试与 Story 只从真实模板截取少量商家，避免另外维护示例商家数据。 */
export function createMerchantPresetOptions(): MerchantPresetOptions {
  const source = getLedgerSetupTemplate("JPY")!;
  const merchants = source.merchants.slice(0, 3);
  const keys = new Set(merchants.flatMap(({ tagKeys }) => tagKeys));
  return {
    currency: source.currency,
    addedKeys: [],
    template: {
      ...source,
      merchants,
      merchantTags: source.merchantTags.filter(({ key }) => keys.has(key)),
    },
  };
}
