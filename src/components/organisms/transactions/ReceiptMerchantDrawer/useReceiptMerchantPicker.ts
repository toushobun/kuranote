"use client";
import { useState } from "react";
import type { FlowMerchant } from "organisms/transactions/MerchantStep/MerchantStep.types";
import { useReceiptCreation } from "organisms/transactions/ReceiptCreationProvider/ReceiptCreationProvider";

/** 首屏和小票抽屉共用选择回调，新增商家后也走相同的选择流程。 */
export function useReceiptMerchantPicker(
  onSelect: (merchant: FlowMerchant) => void,
) {
  const creation = useReceiptCreation();
  const [open, setOpen] = useState(false);
  function selectMerchant(merchant: FlowMerchant) {
    onSelect(merchant);
    setOpen(false);
  }
  return {
    open,
    openPicker: () => setOpen(true),
    closePicker: () => setOpen(false),
    selectMerchant,
    onAddMerchant: creation?.addMerchant
      ? (name?: string) => creation.addMerchant?.(selectMerchant, name)
      : undefined,
    suspended: !!creation?.editor,
  };
}
