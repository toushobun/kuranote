import { useState } from "react";
import {
  createDefaultLedgerSetupDraft,
  getLedgerSetupTemplate,
  type LedgerSetupRegion,
} from "internal/ledger";
import { buildMerchantChecklist } from "utils/merchantPresets";
import { MerchantPresetSelector } from "./MerchantPresetSelector";

/** Story 与组件测试共用真实服务端模板的展示数据和受控状态。 */
export function MerchantPresetSelectorExample({
  initialSelectedKeys,
  initialAdditionalRegions = [],
  initialRegion = "jp",
  onChange,
}: {
  initialSelectedKeys?: string[];
  initialAdditionalRegions?: LedgerSetupRegion[];
  initialRegion?: LedgerSetupRegion;
  onChange?: (keys: string[]) => void;
}) {
  const [region, setRegion] = useState(initialRegion);
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
      onAdditionalRegionsChange={setAdditionalRegions}
      onRegionChange={(next) => {
        setAdditionalRegions([region]);
        setRegion(next);
      }}
      selectedKeys={selectedKeys}
      onChange={(keys) => {
        setSelectedKeys(keys);
        onChange?.(keys);
      }}
    />
  );
}
