"use client";

import { merchantPresetMessages } from "config/merchantPresetMessages";
import { regionPresetMessages } from "config/regionPresetMessages";
import type { LedgerSetupRegion } from "internal/ledger";
import { RegionPresetSelector } from "molecules/ui/RegionPresetSelector/RegionPresetSelector";
import type { buildMerchantChecklist } from "utils/merchantPresets";

export type MerchantPresetSelectorProps = ReturnType<
  typeof buildMerchantChecklist
> & {
  region: LedgerSetupRegion | null;
  additionalRegions: readonly LedgerSetupRegion[];
  onAdditionalRegionsChange: (regions: LedgerSetupRegion[]) => void;
  selectedKeys: readonly string[];
  onChange: (keys: string[]) => void;
  disabledKeys?: readonly string[];
  disabled?: boolean;
};

const messages = {
  checklist: merchantPresetMessages.checklist,
  selectedCount: regionPresetMessages.merchantSelectedCount,
  sharedHint: regionPresetMessages.sharedMerchants,
  title: regionPresetMessages.merchantGroup,
};

/** 商家预设：在第二地区首次勾选时登记追加地区（决定保存时的商家范围）。 */
export function MerchantPresetSelector({
  additionalRegions,
  onAdditionalRegionsChange,
  ...props
}: MerchantPresetSelectorProps) {
  return (
    <RegionPresetSelector
      {...props}
      messages={messages}
      onSecondaryRegionSelect={(region) => {
        if (!additionalRegions.includes(region)) {
          onAdditionalRegionsChange([...additionalRegions, region]);
        }
      }}
    />
  );
}
