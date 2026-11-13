"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { routePaths, transactionsNewEntryHref } from "config/paths";
import type { TransactionEntryMethod } from "types/transactions";
import { useMerchantEntrySuggestions } from "./useMerchantEntrySuggestions";

export function useNewTransactionStepFlow({
  initialMethod,
  ledgerId,
}: {
  initialMethod: TransactionEntryMethod;
  ledgerId: string;
}) {
  const router = useRouter();
  const [method, setMethod] = useState(initialMethod);
  const { suggestions, suggestionsMerchantId, selectSuggestionMerchant } =
    useMerchantEntrySuggestions({ ledgerId });
  const [presetsOpen, setPresetsOpen] = useState(false);
  // 切换方式只在浏览器端换内容（#1050）：不重新请求页面，地址同步为当前方式，
  // 刷新后仍停在这个方式；替换当前历史记录，返回键直接离开记一笔。
  function changeMethod(next: TransactionEntryMethod) {
    setMethod(next);
    window.history.replaceState(
      window.history.state,
      "",
      transactionsNewEntryHref({ method: next }),
    );
  }

  return {
    method,
    suggestions,
    suggestionsMerchantId,
    presetsOpen,
    closePresets: () => setPresetsOpen(false),
    onPresetsAdded: () => {
      setPresetsOpen(false);
      router.refresh();
    },
    onClose: () => router.push(routePaths.transactions),
    onMethodChange: changeMethod,
    flowHandlers: {
      onMerchantSelect: selectSuggestionMerchant,
      onAccountSelect: () => {},
      onAddPresets: () => setPresetsOpen(true),
    },
  };
}
