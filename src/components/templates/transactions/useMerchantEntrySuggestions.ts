"use client";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { transactionEntryApiPaths } from "config/paths";
import type { MerchantEntrySuggestions } from "internal/transaction";
import type { FlowMerchant } from "organisms/transactions/MerchantStep/MerchantStep.types";
import { fetchClientJson } from "lib/api/clientQuery";

// 获取失败时按商家没有记录处理，不阻断记账。
const emptySuggestions: MerchantEntrySuggestions = {
  automaticCategoryIds: [],
  quickAmounts: [],
  recommendedAccountIds: [],
};

type MerchantSuggestionState = {
  merchantId: string;
  suggestions: MerchantEntrySuggestions;
};

/** 在浏览器端读取商家的记账建议（推荐账户、自动明细、快捷金额），新增与编辑记账共用。 */
export function useMerchantEntrySuggestions({
  initialMerchantId,
  ledgerId,
}: {
  /** 进入页面时已选中的商家，挂载后读取一次。 */
  initialMerchantId?: string;
  ledgerId: string;
}) {
  const [suggestionState, setSuggestionState] =
    useState<MerchantSuggestionState | null>(null);
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

  function clearSuggestions() {
    suggestionRequest.current?.abort();
    suggestionRequest.current = null;
    setSuggestionState(null);
  }

  function selectSuggestionMerchant(merchant: FlowMerchant) {
    if (merchant.hasTransactions) {
      loadSuggestions(merchant.id);
    } else {
      clearSuggestions();
    }
  }

  const loadInitialSuggestions = useEffectEvent(loadSuggestions);
  useEffect(() => {
    if (initialMerchantId) loadInitialSuggestions(initialMerchantId);
    return () => suggestionRequest.current?.abort();
  }, [initialMerchantId]);

  return {
    suggestions: suggestionState?.suggestions,
    suggestionsMerchantId: suggestionState?.merchantId,
    selectSuggestionMerchant,
  };
}
