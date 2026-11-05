import type { buildMerchantChecklist } from "utils/merchantPresets";
import type { LedgerSetupRegion } from "internal/ledger";

/** 预设弹框的展示数据；完整模板和写入资料保留在服务端。 */
export type MerchantPresetOptions = ReturnType<
  typeof buildMerchantChecklist
> & {
  addedKeys: string[];
  region: LedgerSetupRegion | null;
  templateVersion: number | null;
};
