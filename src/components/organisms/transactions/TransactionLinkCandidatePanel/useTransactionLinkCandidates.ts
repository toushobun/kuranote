import { useCallback, useEffect, useRef, useState } from "react";
import type {
  TransactionLinkCandidatePage,
  TransactionLinkCandidatePageInput,
} from "types/transactions";
import { mergeUniqueById } from "utils/collections";

export type LoadTransactionLinkCandidatePage = (
  input: TransactionLinkCandidatePageInput,
) => Promise<TransactionLinkCandidatePage>;

export function useTransactionLinkCandidates({
  loadPageAction,
  merchantId,
  accountCurrency,
  kind,
  month,
}: {
  loadPageAction?: LoadTransactionLinkCandidatePage;
  merchantId?: string;
  accountCurrency?: string;
  kind: "refund" | "reimbursement";
  month: string;
}) {
  const [query, setQuery] = useState("");
  const [searchMonth, setSearchMonth] = useState<string | null>(null);
  const [page, setPage] = useState<TransactionLinkCandidatePage | null>(null);
  // 搜索词变化时立刻隐藏旧页，不等防抖结束，避免旧折叠行仍可点击。
  const [loadedTerm, setLoadedTerm] = useState<string | null>(null);
  const [loadedMonth, setLoadedMonth] = useState<string | null>(null);
  const [settledPage, setSettledPage] =
    useState<TransactionLinkCandidatePage | null>(null);
  const [settledExpanded, setSettledExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [settledLoading, setSettledLoading] = useState(false);
  const [error, setError] = useState(false);
  const [settledError, setSettledError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const loadPageActionRef = useRef(loadPageAction);
  const hasLoadPageAction = Boolean(loadPageAction);
  const generation = useRef(0);
  const pendingMore = useRef(false);
  const pendingSettled = useRef(false);
  const pageGeneration = useRef(0);
  const term = query.trim();
  const displayedMonth = term ? searchMonth : month;

  useEffect(() => {
    loadPageActionRef.current = loadPageAction;
  }, [loadPageAction]);

  useEffect(() => {
    const revision = ++generation.current;
    const current = () => generation.current === revision;
    const timeout = setTimeout(
      () => {
        setPage(null);
        setSettledPage(null);
        setSettledExpanded(false);
        setLoading(hasLoadPageAction);
        setLoadingMore(false);
        setSettledLoading(false);
        setError(false);
        setSettledError(false);
        pendingMore.current = false;
        pendingSettled.current = false;
        const action = loadPageActionRef.current;
        if (!action) return;
        void (async () => {
          try {
            const next = await action({
              offset: 0,
              query: term,
              month: displayedMonth,
              merchantId,
              currency: accountCurrency,
            });
            if (current()) {
              pageGeneration.current = revision;
              setPage(next);
              setLoadedTerm(term);
              setLoadedMonth(displayedMonth);
            }
          } catch {
            if (current()) setError(true);
          } finally {
            if (current()) setLoading(false);
          }
        })();
      },
      term ? 250 : 0,
    );
    return () => {
      clearTimeout(timeout);
      generation.current = revision + 1;
    };
  }, [
    hasLoadPageAction,
    merchantId,
    accountCurrency,
    kind,
    term,
    displayedMonth,
    retryKey,
  ]);

  const loadMore = useCallback(async () => {
    if (
      !loadPageActionRef.current ||
      page?.nextOffset == null ||
      pendingMore.current ||
      pageGeneration.current !== generation.current
    )
      return;
    const revision = generation.current;
    pendingMore.current = true;
    setLoadingMore(true);
    setError(false);
    try {
      const next = await loadPageActionRef.current({
        offset: page.nextOffset,
        query: term,
        month: displayedMonth,
        merchantId,
        currency: accountCurrency,
      });
      if (generation.current === revision)
        setPage({
          items: mergeUniqueById(page.items, next.items),
          nextOffset: next.nextOffset,
          settledCount: next.settledCount ?? page.settledCount,
          historyMerchantIds:
            next.historyMerchantIds ?? page.historyMerchantIds,
          groupCounts: next.groupCounts ?? page.groupCounts,
        });
    } catch {
      if (generation.current === revision) setError(true);
    } finally {
      if (generation.current === revision) {
        setLoadingMore(false);
        pendingMore.current = false;
      }
    }
  }, [page, term, displayedMonth, merchantId, accountCurrency]);

  async function loadSettled() {
    if (
      !loadPageActionRef.current ||
      pendingSettled.current ||
      pageGeneration.current !== generation.current ||
      (settledPage !== null && settledPage.nextOffset === null)
    )
      return;
    const revision = generation.current;
    pendingSettled.current = true;
    setSettledLoading(true);
    setSettledError(false);
    try {
      const next = await loadPageActionRef.current({
        offset: settledPage?.nextOffset ?? 0,
        query: term,
        month: displayedMonth,
        merchantId,
        currency: accountCurrency,
        settled: true,
      });
      if (generation.current === revision)
        setSettledPage({
          items: mergeUniqueById(settledPage?.items ?? [], next.items),
          nextOffset: next.nextOffset,
          settledCount: next.settledCount,
        });
    } catch {
      if (generation.current === revision) setSettledError(true);
    } finally {
      if (generation.current === revision) {
        setSettledLoading(false);
        pendingSettled.current = false;
      }
    }
  }

  function toggleSettled() {
    if (settledExpanded) {
      setSettledExpanded(false);
      return;
    }
    setSettledExpanded(true);
    if (!settledPage) void loadSettled();
  }

  const queryStale = loadedTerm !== term || loadedMonth !== displayedMonth;
  return {
    query,
    setQuery,
    searchMonth,
    setSearchMonth,
    displayedMonth,
    page: queryStale ? null : page,
    settledPage: queryStale ? null : settledPage,
    settledExpanded,
    toggleSettled,
    loading: loading || (queryStale && !error && hasLoadPageAction),
    loadingMore,
    settledLoading,
    error,
    settledError,
    loadMore,
    loadMoreSettled: loadSettled,
    retry: () => (page ? void loadMore() : setRetryKey((key) => key + 1)),
    retrySettled: loadSettled,
  };
}
