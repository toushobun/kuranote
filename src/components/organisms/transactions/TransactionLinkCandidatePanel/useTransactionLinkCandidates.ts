import { useEffect, useRef, useState } from "react";
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
}: {
  loadPageAction?: LoadTransactionLinkCandidatePage;
  merchantId?: string;
  accountCurrency?: string;
  kind: "refund" | "reimbursement";
}) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState<TransactionLinkCandidatePage | null>(null);
  const [settledPage, setSettledPage] =
    useState<TransactionLinkCandidatePage | null>(null);
  const [settledExpanded, setSettledExpanded] = useState(false);
  const [browseMerchantId, setBrowseMerchantId] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [settledLoading, setSettledLoading] = useState(false);
  const [error, setError] = useState(false);
  const [settledError, setSettledError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const generation = useRef(0);
  const pendingMore = useRef(false);
  const pendingSettled = useRef(false);
  const pageGeneration = useRef(0);
  const term = query.trim();

  useEffect(() => {
    const revision = ++generation.current;
    const current = () => generation.current === revision;
    const timeout = setTimeout(
      () => {
        setPage(null);
        setSettledPage(null);
        setSettledExpanded(false);
        setLoading(Boolean(loadPageAction));
        setLoadingMore(false);
        setSettledLoading(false);
        setError(false);
        setSettledError(false);
        pendingMore.current = false;
        pendingSettled.current = false;
        if (!loadPageAction) return;
        void (async () => {
          let appliedMerchantId =
            kind === "refund" && !term ? merchantId : undefined;
          try {
            let next = await loadPageAction({
              offset: 0,
              query: term,
              merchantId: appliedMerchantId,
              currency: accountCurrency,
            });
            if (!current()) return;
            if (
              appliedMerchantId &&
              next.items.length === 0 &&
              !next.settledCount
            ) {
              appliedMerchantId = undefined;
              next = await loadPageAction({
                offset: 0,
                query: term,
                currency: accountCurrency,
              });
            }
            if (current()) {
              pageGeneration.current = revision;
              setPage(next);
              setBrowseMerchantId(appliedMerchantId);
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
  }, [loadPageAction, merchantId, accountCurrency, kind, term, retryKey]);

  async function loadMore() {
    if (
      !loadPageAction ||
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
      const next = await loadPageAction({
        offset: page.nextOffset,
        query: term,
        merchantId: browseMerchantId,
        currency: accountCurrency,
      });
      if (generation.current === revision)
        setPage({
          items: mergeUniqueById(page.items, next.items),
          nextOffset: next.nextOffset,
          settledCount: next.settledCount ?? page.settledCount,
        });
    } catch {
      if (generation.current === revision) setError(true);
    } finally {
      if (generation.current === revision) {
        setLoadingMore(false);
        pendingMore.current = false;
      }
    }
  }

  async function loadSettled() {
    if (
      !loadPageAction ||
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
      const next = await loadPageAction({
        offset: settledPage?.nextOffset ?? 0,
        query: term,
        merchantId: browseMerchantId,
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

  return {
    query,
    setQuery,
    page,
    settledPage,
    settledExpanded,
    toggleSettled,
    browseMerchantId,
    loading,
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
