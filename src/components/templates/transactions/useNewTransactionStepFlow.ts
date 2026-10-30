"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  accountsCreateHref,
  merchantsNewHref,
  routePaths,
  transactionsNewEntryHref,
} from "config/paths";
import { useTransactionEntryMethodChange } from "organisms/transactions/TransactionEntryMethodSwitch/useTransactionEntryMethodChange";
import { useMerchantEntrySuggestions } from "./useMerchantEntrySuggestions";

export function useNewTransactionStepFlow({
  initialMerchantId,
  ledgerId,
}: {
  initialMerchantId?: string;
  ledgerId: string;
}) {
  const router = useRouter();
  const changeMethod = useTransactionEntryMethodChange();
  // 新建商家后返回时，为预选的商家读取一次建议。
  const { suggestions, suggestionsMerchantId, loadSuggestions } =
    useMerchantEntrySuggestions({ initialMerchantId, ledgerId });
  const [selectedMerchantId, setSelectedMerchantId] =
    useState(initialMerchantId);
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
        setSelectedMerchantId(merchant.id);
        loadSuggestions(merchant.id);
      },
      onAccountSelect: () => {},
      onAddMerchant: (name?: string) =>
        router.push(merchantsNewHref(returnTo, name)),
      onAddPresets: () => setPresetsOpen(true),
      // 新增账户后带着当前商家回来，自动选中新账户。
      onAddAccount: () =>
        router.push(
          accountsCreateHref(
            transactionsNewEntryHref({
              merchantId: selectedMerchantId,
              method: "merchant",
            }),
          ),
        ),
    },
  };
}
