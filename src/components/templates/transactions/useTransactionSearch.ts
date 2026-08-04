"use client";

import { useRouter } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  useTransition,
  type FormEvent,
} from "react";

import {
  routePaths,
  transactionEditHref,
  transactionsSearchHref,
} from "config/paths";
import type {
  TransactionListItem,
  TransactionSearchPage,
} from "types/transactions";
import { mergeUniqueById } from "utils/collections";
import { transactionSearchPageErrorMessages } from "utils/transactionMessages";

export type UseTransactionSearchParams = {
  initialPage: TransactionSearchPage;
  initialQuery: string;
  loadSearchPageAction?: (
    query: string,
    offset: number,
  ) => Promise<TransactionSearchPage>;
  syncUrl?: boolean;
};

export function useTransactionSearch({
  initialPage,
  initialQuery,
  loadSearchPageAction,
  syncUrl = true,
}: UseTransactionSearchParams) {
  const router = useRouter();
  const requestVersionRef = useRef(0);
  const [prevInitialPage, setPrevInitialPage] = useState(initialPage);
  const [prevInitialQuery, setPrevInitialQuery] = useState(initialQuery);
  const [inputValue, setInputValue] = useState(initialQuery);
  const [submittedQuery, setSubmittedQuery] = useState(initialQuery);
  const [items, setItems] = useState(initialPage.items);
  const [nextOffset, setNextOffset] = useState(initialPage.nextOffset);
  const [totalCount, setTotalCount] = useState(initialPage.totalCount);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const hasSubmittedQuery = submittedQuery.length > 0;

  if (initialPage !== prevInitialPage || initialQuery !== prevInitialQuery) {
    setPrevInitialPage(initialPage);
    setPrevInitialQuery(initialQuery);
    setInputValue(initialQuery);
    setSubmittedQuery(initialQuery);
    setItems(initialPage.items);
    setNextOffset(initialPage.nextOffset);
    setTotalCount(initialPage.totalCount);
    setSearchError(null);
    setLoadMoreError(null);
  }

  useEffect(() => {
    requestVersionRef.current += 1;
  }, [initialPage, initialQuery]);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextQuery = inputValue.trim();
    requestVersionRef.current += 1;

    if (syncUrl) {
      router.replace(
        nextQuery
          ? transactionsSearchHref(nextQuery)
          : routePaths.transactionsSearch,
      );
      return;
    }
    setSubmittedQuery(nextQuery);
    setSearchError(null);
    setLoadMoreError(null);
    if (!nextQuery || !loadSearchPageAction) {
      setItems([]);
      setNextOffset(null);
      setTotalCount(0);
      return;
    }
    const requestVersion = requestVersionRef.current;
    startTransition(async () => {
      try {
        const page = await loadSearchPageAction(nextQuery, 0);
        if (requestVersionRef.current !== requestVersion) return;
        setItems(page.items);
        setNextOffset(page.nextOffset);
        setTotalCount(page.totalCount);
      } catch {
        if (requestVersionRef.current !== requestVersion) return;
        setItems([]);
        setNextOffset(null);
        setTotalCount(0);
        setSearchError(transactionSearchPageErrorMessages.initialLoadFailed);
      }
    });
  }

  function clearSearch() {
    requestVersionRef.current += 1;
    setInputValue("");
    setSubmittedQuery("");
    setItems([]);
    setNextOffset(null);
    setTotalCount(0);
    setSearchError(null);
    setLoadMoreError(null);
    if (syncUrl) router.replace(routePaths.transactionsSearch);
  }

  function getEditHref(item: TransactionListItem) {
    const returnTo = submittedQuery
      ? transactionsSearchHref(submittedQuery)
      : routePaths.transactionsSearch;

    return transactionEditHref(item.id, returnTo);
  }

  function loadMoreResults() {
    if (!loadSearchPageAction || nextOffset === null || isPending) return;

    const requestVersion = requestVersionRef.current + 1;
    const requestQuery = submittedQuery;
    const requestOffset = nextOffset;
    requestVersionRef.current = requestVersion;
    setLoadMoreError(null);

    startTransition(async () => {
      try {
        const page = await loadSearchPageAction(requestQuery, requestOffset);
        if (requestVersionRef.current !== requestVersion) return;

        setItems((prev) => mergeUniqueById(prev, page.items));
        setNextOffset(page.nextOffset);
        setTotalCount(page.totalCount);
      } catch {
        if (requestVersionRef.current !== requestVersion) return;

        setLoadMoreError(transactionSearchPageErrorMessages.loadMoreFailed);
      }
    });
  }

  return {
    clearSearch,
    getEditHref,
    hasSubmittedQuery,
    inputValue,
    isPending,
    items,
    loadMoreError,
    loadMoreResults,
    nextOffset,
    searchError,
    setInputValue,
    submitSearch,
    submittedQuery,
    totalCount,
  };
}
