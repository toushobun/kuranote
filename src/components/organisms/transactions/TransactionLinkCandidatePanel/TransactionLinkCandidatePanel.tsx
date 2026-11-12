"use client";

import { useEffect, useState } from "react";

import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import { transactionLinkCandidateMessages } from "config/transactionStepFlowMessages";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { TransactionRefundCandidateList } from "organisms/transactions/TransactionGroupList/TransactionGroupList";
import { mergeTransactionDateGroups } from "organisms/transactions/TransactionMonthList/transactionMonthListUtils";
import { mergeUniqueById } from "utils/collections";
import type {
  TransactionGroupPage,
  TransactionMonthPage,
  TransactionRefundCandidate,
  TransactionSearchPage,
  TransactionTimeGroupViewData,
} from "types/transactions";

type TransactionLinkCandidatePanelProps = {
  accountCurrency?: string;
  kind: "refund" | "reimbursement";
  merchantId?: string;
  merchantName?: string;
  loadInitialViewAction?: (
    merchantId?: string,
  ) => Promise<TransactionTimeGroupViewData>;
  loadGroupItemsAction?: (
    groupKey: string,
    offset: number,
    merchantId?: string,
  ) => Promise<TransactionMonthPage>;
  loadMoreGroupsAction?: (
    offset: number,
    merchantId?: string,
  ) => Promise<TransactionGroupPage>;
  loadSearchPageAction?: (
    query: string,
    offset: number,
  ) => Promise<TransactionSearchPage>;
  onChange: (item: TransactionRefundCandidate | null) => void;
  value: TransactionRefundCandidate | null;
};

/** 抽屉内选择一条原支出。退款首屏按当前商家筛选，搜索始终跨商家。 */
export function TransactionLinkCandidatePanel({
  accountCurrency,
  kind,
  merchantId,
  merchantName,
  loadInitialViewAction,
  loadGroupItemsAction,
  loadMoreGroupsAction,
  loadSearchPageAction,
  onChange,
  value,
}: TransactionLinkCandidatePanelProps) {
  const [view, setView] = useState<TransactionTimeGroupViewData | null>(null);
  const [browseMerchantId, setBrowseMerchantId] = useState<string | undefined>(
    merchantId,
  );
  const [loading, setLoading] = useState(false);
  const [browseError, setBrowseError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const [searchRetryKey, setSearchRetryKey] = useState(0);
  const [query, setQuery] = useState("");
  const [searchPage, setSearchPage] = useState<TransactionSearchPage | null>(
    null,
  );
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    if (!loadInitialViewAction) return;
    let cancelled = false;
    // 异步启动避免在 effect 同步清空状态造成连锁重渲染。
    void Promise.resolve().then(async () => {
      if (cancelled) return;
      setLoading(true);
      setBrowseError(false);
      setView(null);
      setBrowseMerchantId(merchantId);
      try {
        let nextView = await loadInitialViewAction(merchantId);
        let appliedMerchantId = merchantId;
        // 没有这家商家的支出时退回全部；报销从来不按商家筛选。
        if (merchantId && nextView.groups.length === 0) {
          nextView = await loadInitialViewAction();
          appliedMerchantId = undefined;
        }
        nextView = await loadMissingGroupItems(
          nextView,
          loadGroupItemsAction,
          appliedMerchantId,
        );
        if (!cancelled) {
          setBrowseMerchantId(appliedMerchantId);
          setView(nextView);
        }
      } catch {
        if (!cancelled) setBrowseError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [loadInitialViewAction, loadGroupItemsAction, merchantId, retryKey]);

  useEffect(() => {
    const term = query.trim();
    let cancelled = false;
    if (!term || !loadSearchPageAction) {
      const timeout = setTimeout(() => setSearchPage(null), 0);
      return () => {
        cancelled = true;
        clearTimeout(timeout);
      };
    }
    const timeout = setTimeout(() => {
      if (cancelled) return;
      setSearchPage(null);
      setSearchLoading(true);
      setSearchError(false);
      void loadSearchPageAction(term, 0)
        .then((page) => {
          if (!cancelled) setSearchPage(page);
        })
        .catch(() => {
          if (!cancelled) setSearchError(true);
        })
        .finally(() => {
          if (!cancelled) setSearchLoading(false);
        });
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [loadSearchPageAction, query, searchRetryKey]);

  async function loadMore() {
    const nextOffset = searchPage?.nextOffset;
    if (nextOffset == null || loadingMore || !loadSearchPageAction) return;
    setLoadingMore(true);
    setSearchError(false);
    try {
      const page = await loadSearchPageAction(query.trim(), nextOffset);
      setSearchPage((previous) =>
        previous
          ? {
              items: [
                ...previous.items,
                ...page.items.filter(
                  (item) =>
                    !previous.items.some((existing) => existing.id === item.id),
                ),
              ],
              nextOffset: page.nextOffset,
              totalCount: page.totalCount,
            }
          : page,
      );
    } catch {
      setSearchError(true);
    } finally {
      setLoadingMore(false);
    }
  }

  async function loadMoreBrowse() {
    if (!view || loadingMore) return;
    setLoadingMore(true);
    setBrowseError(false);
    try {
      const group = view.groups.find(
        (group) => view.initialNextItemOffsetByGroupId[group.id] != null,
      );
      if (group && loadGroupItemsAction) {
        const page = await loadGroupItemsAction(
          group.key,
          view.initialNextItemOffsetByGroupId[group.id]!,
          browseMerchantId,
        );
        setView({
          ...view,
          initialDateGroupsByGroupId: {
            ...view.initialDateGroupsByGroupId,
            [group.id]: mergeTransactionDateGroups(
              view.initialDateGroupsByGroupId[group.id] ?? [],
              page.groups,
            ),
          },
          initialNextItemOffsetByGroupId: {
            ...view.initialNextItemOffsetByGroupId,
            [group.id]: page.nextOffset,
          },
        });
      } else if (view.nextOffset !== null && loadMoreGroupsAction) {
        const page = await loadMoreGroupsAction(
          view.nextOffset,
          browseMerchantId,
        );
        const nextView = {
          ...view,
          groups: mergeUniqueById(view.groups, page.groups),
          nextOffset: page.nextOffset,
          initialDateGroupsByGroupId: { ...view.initialDateGroupsByGroupId },
          initialNextItemOffsetByGroupId: {
            ...view.initialNextItemOffsetByGroupId,
          },
        };
        const hydratedView = await loadMissingGroupItems(
          nextView,
          loadGroupItemsAction,
          browseMerchantId,
        );
        setView(hydratedView);
      }
    } catch {
      setBrowseError(true);
    } finally {
      setLoadingMore(false);
    }
  }

  const searching = Boolean(query.trim());
  const candidateListProps = {
    onSelect: onChange,
    selectableCurrency: accountCurrency,
    selectedId: value?.id,
    selectionKind: kind,
  } as const;

  return (
    <Stack spacing={1.25} sx={{ mt: 1.5 }}>
      <TextField
        fullWidth
        onChange={(event) => setQuery(event.target.value)}
        placeholder={transactionLinkCandidateMessages.searchPlaceholder}
        size="small"
        slotProps={{
          htmlInput: {
            "aria-label": transactionLinkCandidateMessages.searchAria,
          },
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchRoundedIcon fontSize="small" />
              </InputAdornment>
            ),
          },
        }}
        value={query}
      />
      <Stack
        direction="row"
        sx={{ justifyContent: "space-between", color: "text.secondary" }}
      >
        <Typography variant="caption">
          {kind === "reimbursement"
            ? transactionLinkCandidateMessages.pending
            : browseMerchantId && !searching
              ? transactionLinkCandidateMessages.merchantExpenses(
                  merchantName ?? "",
                )
              : transactionLinkCandidateMessages.allExpenses}
        </Typography>
        <Typography variant="caption">{accountCurrency}</Typography>
      </Stack>
      <Stack spacing={1}>
        {searching ? (
          searchLoading ? (
            <CircularProgress size={24} />
          ) : searchPage ? (
            <>
              {searchPage.items.length ? (
                <TransactionRefundCandidateList
                  items={searchPage.items}
                  {...candidateListProps}
                />
              ) : (
                <Typography color="textSecondary">
                  {transactionLinkCandidateMessages.noSearchResults}
                </Typography>
              )}
              {searchPage.nextOffset !== null ? (
                <Button disabled={loadingMore} onClick={() => void loadMore()}>
                  {loadingMore
                    ? transactionLinkCandidateMessages.loading
                    : transactionLinkCandidateMessages.loadMore}
                </Button>
              ) : null}
            </>
          ) : null
        ) : loading ? (
          <CircularProgress size={24} />
        ) : view ? (
          view.groups.length === 0 ? (
            <Typography color="textSecondary" variant="body2">
              {transactionLinkCandidateMessages.noCandidates}
            </Typography>
          ) : (
            <>
              <TransactionRefundCandidateList
                items={view.groups.flatMap((group) =>
                  (view.initialDateGroupsByGroupId[group.id] ?? []).flatMap(
                    (date) => date.items,
                  ),
                )}
                {...candidateListProps}
              />
              {view.nextOffset !== null ||
              Object.values(view.initialNextItemOffsetByGroupId).some(
                (offset) => offset !== null,
              ) ? (
                <Button
                  disabled={loadingMore}
                  onClick={() => void loadMoreBrowse()}
                >
                  {loadingMore
                    ? transactionLinkCandidateMessages.loading
                    : transactionLinkCandidateMessages.loadMore}
                </Button>
              ) : null}
            </>
          )
        ) : null}
        {(searching ? searchError : browseError) ? (
          <Button
            onClick={() =>
              searching
                ? setSearchRetryKey((value) => value + 1)
                : view
                  ? void loadMoreBrowse()
                  : setRetryKey((value) => value + 1)
            }
          >
            {transactionLinkCandidateMessages.retry}
          </Button>
        ) : null}
      </Stack>
    </Stack>
  );
}

async function loadMissingGroupItems(
  view: TransactionTimeGroupViewData,
  loadItems: TransactionLinkCandidatePanelProps["loadGroupItemsAction"],
  merchantId?: string,
): Promise<TransactionTimeGroupViewData> {
  if (!loadItems) return view;
  const nextView = {
    ...view,
    initialDateGroupsByGroupId: { ...view.initialDateGroupsByGroupId },
    initialNextItemOffsetByGroupId: { ...view.initialNextItemOffsetByGroupId },
  };
  for (const group of view.groups) {
    if (group.id in nextView.initialDateGroupsByGroupId) continue;
    const page = await loadItems(group.key, 0, merchantId);
    nextView.initialDateGroupsByGroupId[group.id] = page.groups;
    nextView.initialNextItemOffsetByGroupId[group.id] = page.nextOffset;
  }
  return nextView;
}
