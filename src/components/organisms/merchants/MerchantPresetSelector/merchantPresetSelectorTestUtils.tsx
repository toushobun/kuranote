import { useState } from "react";
import { regionPresetMessages } from "config/regionPresetMessages";
import {
  createDefaultLedgerSetupDraft,
  getLedgerSetupTemplate,
  type LedgerSetupRegion,
} from "internal/ledger";
import { buildMerchantChecklist } from "utils/merchantPresets";
import { MerchantPresetSelector } from "./MerchantPresetSelector";

export function merchantRegionButtonName(region: LedgerSetupRegion) {
  return { name: regionPresetMessages.merchantGroup(region) };
}

/** Story 与组件测试共用真实服务端模板的展示数据和受控状态。 */
export function MerchantPresetSelectorExample({
  initialSelectedKeys,
  initialAdditionalRegions = [],
  initialRegion = "jp",
  onChange,
  onAdditionalRegionsChange,
}: {
  initialSelectedKeys?: string[];
  initialAdditionalRegions?: LedgerSetupRegion[];
  initialRegion?: LedgerSetupRegion;
  onAdditionalRegionsChange?: (regions: LedgerSetupRegion[]) => void;
  onChange?: (keys: string[]) => void;
}) {
  const region = initialRegion;
  const [additionalRegions, setAdditionalRegions] = useState(
    initialAdditionalRegions,
  );
  const [selectedKeys, setSelectedKeys] = useState(
    initialSelectedKeys ??
      createDefaultLedgerSetupDraft(initialRegion).merchants.selectedKeys,
  );
  const checklist = buildMerchantChecklist(getLedgerSetupTemplate(region)!);
  return (
    <MerchantPresetSelector
      {...checklist}
      region={region}
      additionalRegions={additionalRegions}
      onAdditionalRegionsChange={(regions) => {
        setAdditionalRegions(regions);
        onAdditionalRegionsChange?.(regions);
      }}
      selectedKeys={selectedKeys}
      onChange={(keys) => {
        setSelectedKeys(keys);
        onChange?.(keys);
      }}
    />
  );
}
