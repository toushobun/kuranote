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
  const [browseMerchantId, setBrowseMerchantId] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const generation = useRef(0);
  const pendingMore = useRef(false);
  const pageGeneration = useRef(0);
  const term = query.trim();

  useEffect(() => {
    const revision = ++generation.current;
    const current = () => generation.current === revision;
    const timeout = setTimeout(
      () => {
        setPage(null);
        setLoading(Boolean(loadPageAction));
        setLoadingMore(false);
        setError(false);
        pendingMore.current = false;
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
            if (appliedMerchantId && next.items.length === 0) {
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
  return {
    query,
    setQuery,
    page,
    browseMerchantId,
    loading,
    loadingMore,
    error,
    loadMore,
    retry: () => (page ? void loadMore() : setRetryKey((key) => key + 1)),
  };
}
