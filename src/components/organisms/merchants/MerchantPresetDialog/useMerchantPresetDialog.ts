"use client";

import { useState } from "react";
import type { MerchantPresetOptions } from "internal/merchant";
import { getPresetSelection } from "molecules/ui/GroupedPresetChecklist/presetSelection";
import { useMerchantsActionState } from "templates/merchants/useMerchantsActionState";
import type { MerchantPresetStateAction } from "types/merchants";

export function useMerchantPresetDialog(
  options: MerchantPresetOptions,
  action: MerchantPresetStateAction,
  returnTo: string | null = null,
) {
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
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
    formData.set("currency", options.currency);
    formData.set("templateVersion", String(options.templateVersion));
    for (const key of selection.keys) formData.append("selectedKeys", key);
    if (returnTo) formData.set("returnTo", returnTo);
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
