"use client";
import { useState } from "react";
import type { FlowMerchant } from "organisms/transactions/MerchantStep/MerchantStep.types";
import { useTransactionReceiptForm } from "organisms/transactions/TransactionConfirmStep/useTransactionReceiptForm";
import type { TransactionFormInitialValues } from "organisms/transactions/TransactionForm/TransactionForm.types";
import type { ItemsStepOptions } from "organisms/transactions/TransactionStepFlow/TransactionStepFlow.types";
import type { TransactionAccountOption } from "types/transactions";
import { useMerchantEntrySuggestions } from "./useMerchantEntrySuggestions";

/**
 * 编辑记账的小票（#962）：预填记录内容；换商家只换商家本身，
 * 不走快速路线（不自动加明细、不换账户），快捷金额跟随当前商家。
 */
export function useEditTransactionReceipt({
  accountOptions,
  initialValues,
  itemsOptions,
  ledgerId,
  merchantOptions,
  readOnly,
}: {
  accountOptions: TransactionAccountOption[];
  initialValues: TransactionFormInitialValues;
  itemsOptions: ItemsStepOptions;
  ledgerId: string;
  merchantOptions: FlowMerchant[];
  readOnly: boolean;
}) {
  const receipt = useTransactionReceiptForm({
    accounts: accountOptions,
    merchants: merchantOptions,
    itemsOptions,
    initialValues,
  });
  // 只读时不需要快捷金额。
  const { suggestions, suggestionsMerchantId, loadSuggestions } =
    useMerchantEntrySuggestions({
      initialMerchantId: readOnly
        ? undefined
        : initialValues.merchantId || undefined,
      ledgerId,
    });
  const [merchantPickerOpen, setMerchantPickerOpen] = useState(false);

  function selectMerchant(merchant: FlowMerchant) {
    receipt.form.handleMerchantChange(merchant.id);
    loadSuggestions(merchant.id);
    setMerchantPickerOpen(false);
  }

  return {
    ...receipt,
    // 换商家后只采用新商家的建议。
    suggestions:
      suggestionsMerchantId === receipt.form.selectedMerchantId
        ? suggestions
        : undefined,
    merchantPickerOpen,
    openMerchantPicker: () => setMerchantPickerOpen(true),
    closeMerchantPicker: () => setMerchantPickerOpen(false),
    selectMerchant,
  };
}
