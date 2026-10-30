import type { FrequentMerchant } from "internal/transaction";
import type { MerchantTag } from "types/merchants";
import type { TransactionMerchantOption } from "types/transactions";

export type FlowMerchant = TransactionMerchantOption & { tags: MerchantTag[] };
export type MerchantStepProps = {
  merchants: FlowMerchant[];
  merchantTags: MerchantTag[];
  frequentMerchants: FrequentMerchant[];
  /** 快速路线读取建议期间，被点中的商家显示加载状态。 */
  loadingMerchantId?: string | null;
  onSelect: (merchant: FlowMerchant) => void;
  /** 不传时不显示「新增商家」入口（编辑记账，#962）。 */
  onAddMerchant?: (name?: string) => void;
  /** 不传时不显示「从预设添加」入口（编辑记账，#962）。 */
  onAddPresets?: () => void;
};
