"use client";
import { useState } from "react";
import type { FlowMerchant } from "organisms/transactions/MerchantStep/MerchantStep.types";
import { useReceiptCreation } from "organisms/transactions/ReceiptCreationProvider/ReceiptCreationProvider";

/** 从抽屉选择已有商家和新增商家成功后走同一条选择路径。 */
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
