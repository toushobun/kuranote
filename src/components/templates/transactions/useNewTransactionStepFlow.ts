"use client";
import { useRouter } from "next/navigation";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import {
  accountsCreateHref,
  merchantsNewHref,
  routePaths,
  transactionEntryApiPaths,
  transactionsNewEntryHref,
} from "config/paths";
import type { MerchantEntrySuggestions } from "internal/transaction";
import { fetchClientJson } from "lib/api/clientQuery";
import { useTransactionEntryMethodChange } from "organisms/transactions/TransactionEntryMethodSwitch/useTransactionEntryMethodChange";

// 获取失败时按「这家商家还没有记录」处理，不阻断手动记账。
const emptySuggestions: MerchantEntrySuggestions = {
  automaticCategoryIds: [],
  quickAmounts: [],
  recommendedAccountIds: [],
};

type MerchantSuggestionState = {
  merchantId: string;
  suggestions: MerchantEntrySuggestions;
};

export function useNewTransactionStepFlow({
  initialMerchantId,
  ledgerId,
}: {
  initialMerchantId?: string;
  ledgerId: string;
}) {
  const router = useRouter();
  const changeMethod = useTransactionEntryMethodChange();
  const [suggestionState, setSuggestionState] =
    useState<MerchantSuggestionState | null>(null);
  const [selectedMerchantId, setSelectedMerchantId] =
    useState(initialMerchantId);
  const [presetsOpen, setPresetsOpen] = useState(false);
  const suggestionRequest = useRef<AbortController | null>(null);

  function loadSuggestions(merchantId: string) {
    // 快速切换商家时取消上一家的请求，只采用当前商家的结果。
    suggestionRequest.current?.abort();
    const controller = new AbortController();
    suggestionRequest.current = controller;
    void fetchClientJson<MerchantEntrySuggestions>(
      transactionEntryApiPaths.merchantEntrySuggestions(ledgerId, merchantId),
      controller.signal,
    ).then((suggestions) => {
      if (controller.signal.aborted) return;
      setSuggestionState({
        merchantId,
        suggestions: suggestions ?? emptySuggestions,
      });
    });
  }

  // 新建商家后返回时，为预选的商家读取一次建议。
  const loadInitialSuggestions = useEffectEvent(loadSuggestions);
  useEffect(() => {
    if (initialMerchantId) loadInitialSuggestions(initialMerchantId);
    return () => suggestionRequest.current?.abort();
  }, [initialMerchantId]);

  const returnTo = transactionsNewEntryHref({ method: "merchant" });
  return {
    suggestions: suggestionState?.suggestions,
    suggestionsMerchantId: suggestionState?.merchantId,
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
