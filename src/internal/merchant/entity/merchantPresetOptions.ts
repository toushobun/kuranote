import type { buildMerchantChecklist } from "utils/merchantPresets";

/** 预设弹框的展示数据；完整模板和写入资料保留在服务端。 */
export type MerchantPresetOptions = ReturnType<
  typeof buildMerchantChecklist
> & {
  addedKeys: string[];
  currency: string;
  templateVersion: number | null;
};
