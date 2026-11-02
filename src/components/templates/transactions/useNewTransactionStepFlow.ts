"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { routePaths } from "config/paths";
import { useTransactionEntryMethodChange } from "organisms/transactions/TransactionEntryMethodSwitch/useTransactionEntryMethodChange";
import { useMerchantEntrySuggestions } from "./useMerchantEntrySuggestions";

export function useNewTransactionStepFlow({ ledgerId }: { ledgerId: string }) {
  const router = useRouter();
  const changeMethod = useTransactionEntryMethodChange();
  const { suggestions, suggestionsMerchantId, loadSuggestions } =
    useMerchantEntrySuggestions({ ledgerId });
  const [presetsOpen, setPresetsOpen] = useState(false);

  return {
    suggestions,
    suggestionsMerchantId,
    presetsOpen,
    closePresets: () => setPresetsOpen(false),
    onPresetsAdded: () => {
      setPresetsOpen(false);
      router.refresh();
    },
    flowHandlers: {
      onClose: () => router.push(routePaths.transactions),
      onMethodChange: changeMethod,
      onMerchantSelect: (merchant: { id: string }) => {
        loadSuggestions(merchant.id);
      },
      onAccountSelect: () => {},
      onAddPresets: () => setPresetsOpen(true),
    },
  };
}
