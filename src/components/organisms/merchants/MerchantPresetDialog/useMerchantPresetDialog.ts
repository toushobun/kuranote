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
  const [region, setRegion] = useState(options.region);
  const [additionalRegions, setAdditionalRegions] = useState<
    LedgerSetupRegion[]
  >([]);
  const checklist = options.templateVersion === null ? null : options;
  const selection = getPresetSelection(
    checklist?.items ?? [],
    selectedKeys,
    options.addedKeys,
  );
  const submission = useMerchantsActionState(action, { operation: "create" });
  function submit(formData: FormData) {
    if (
      submission.pending ||
      selection.keys.length === 0 ||
      options.templateVersion === null
    )
      return;
    if (!region) return;
    for (const value of [
      region,
      ...additionalRegions.filter((value) => value !== region),
    ])
      formData.append("regions", value);
    formData.set("templateVersion", String(options.templateVersion));
    for (const key of selection.keys) formData.append("selectedKeys", key);
    if (inline) formData.set("presentation", "dialog");
    submission.action(formData);
  }
  return {
    checklist,
    region,
    setRegion(next: LedgerSetupRegion) {
      if (region && region !== next) setAdditionalRegions([region]);
      setRegion(next);
    },
    additionalRegions,
    setAdditionalRegions,
    selection,
    setSelectedKeys,
    selectedKeys: selection.keys,
    submission,
    submit,
  };
}
