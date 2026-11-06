"use client";

import { useState } from "react";
import type { MerchantPresetOptions } from "internal/merchant";
import { getPresetSelection } from "molecules/ui/GroupedPresetChecklist/presetSelection";
import { useMerchantsActionState } from "templates/merchants/useMerchantsActionState";
import type { MerchantPresetStateAction } from "types/merchants";
import type { LedgerSetupRegion } from "internal/ledger";

export function useMerchantPresetDialog(
  options: MerchantPresetOptions,
  action: MerchantPresetStateAction,
  inline = false,
) {
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const region = options.region ?? "jp";
  const [additionalRegions, setAdditionalRegions] = useState<
    LedgerSetupRegion[]
  >([]);
  const selection = getPresetSelection(
    options.items,
    selectedKeys,
    options.addedKeys,
  );
  const submission = useMerchantsActionState(action, { operation: "create" });
  function submit(formData: FormData) {
    if (
      submission.pending ||
      selection.length === 0 ||
      options.templateVersion === null
    )
      return;
    for (const value of [
      region,
      ...additionalRegions.filter((value) => value !== region),
    ])
      formData.append("regions", value);
    formData.set("templateVersion", String(options.templateVersion));
    for (const key of selection) formData.append("selectedKeys", key);
    if (inline) formData.set("presentation", "dialog");
    submission.action(formData);
  }
  return {
    additionalRegions,
    setAdditionalRegions,
    setSelectedKeys,
    selectedKeys: selection,
    submission,
    submit,
  };
}
