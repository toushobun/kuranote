"use client";

import { useMemo, useState } from "react";
import type { MerchantPresetOptions } from "internal/merchant";
import { getPresetSelection } from "molecules/ui/GroupedPresetChecklist/presetSelection";
import { useMerchantsActionState } from "templates/merchants/useMerchantsActionState";
import type { MerchantPresetStateAction } from "types/merchants";
import { buildMerchantChecklist } from "utils/merchantPresets";

export function useMerchantPresetDialog(
  options: MerchantPresetOptions,
  action: MerchantPresetStateAction,
) {
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const checklist = useMemo(
    () => (options.template ? buildMerchantChecklist(options.template) : null),
    [options.template],
  );
  const selection = getPresetSelection(
    checklist?.items ?? [],
    selectedKeys,
    options.addedKeys,
  );
  const submission = useMerchantsActionState(action, { operation: "create" });
  function submit(formData: FormData) {
    if (submission.pending || selection.keys.length === 0 || !options.template)
      return;
    formData.set("currency", options.currency);
    formData.set("templateVersion", String(options.template.version));
    for (const key of selection.keys) formData.append("selectedKeys", key);
    submission.action(formData);
  }
  return {
    checklist,
    selection,
    setSelectedKeys,
    selectedKeys: selection.keys,
    submission,
    submit,
    toggleAll: () => setSelectedKeys(selection.toggleAllKeys),
  };
}
