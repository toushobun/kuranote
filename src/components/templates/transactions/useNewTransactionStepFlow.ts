"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { routePaths, transactionsNewEntryHref } from "config/paths";
import { useTransactionEntryMethodChange } from "organisms/transactions/TransactionEntryMethodSwitch/useTransactionEntryMethodChange";
import { useMerchantEntrySuggestions } from "./useMerchantEntrySuggestions";

export function useNewTransactionStepFlow({ ledgerId }: { ledgerId: string }) {
  const router = useRouter();
  const changeMethod = useTransactionEntryMethodChange();
  const { suggestions, suggestionsMerchantId, loadSuggestions } =
    useMerchantEntrySuggestions({ ledgerId });
  const [presetsOpen, setPresetsOpen] = useState(false);

  const returnTo = transactionsNewEntryHref({ method: "merchant" });
  return {
    suggestions,
    suggestionsMerchantId,
    presetsOpen,
    presetsReturnTo: returnTo,
    closePresets: () => setPresetsOpen(false),
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
