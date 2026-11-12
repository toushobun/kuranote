"use client";

import { useEffect, useState } from "react";

import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { TransactionRefundCandidateList } from "organisms/transactions/TransactionGroupList/TransactionGroupList";
import { TransactionMonthList } from "organisms/transactions/TransactionMonthList/TransactionMonthList";
import type {
  TransactionGroupPage,
  TransactionMonthPage,
  TransactionRefundCandidate,
  TransactionSearchPage,
  TransactionTimeGroupViewData,
} from "types/transactions";

type TransactionLinkCandidatePanelProps = {
  accountCurrency?: string;
  amount: string;
  kind: "refund" | "reimbursement";
  merchantId?: string;
  loadInitialViewAction?: (merchantId?: string) => Promise<TransactionTimeGroupViewData>;
  loadGroupItemsAction?: (groupKey: string, offset: number, merchantId?: string) => Promise<TransactionMonthPage>;
  loadMoreGroupsAction?: (offset: number, merchantId?: string) => Promise<TransactionGroupPage>;
  loadSearchPageAction?: (query: string, offset: number) => Promise<TransactionSearchPage>;
  onAmountChange: (amount: string) => void;
  onChange: (item: TransactionRefundCandidate | null) => void;
  value: TransactionRefundCandidate | null;
};

/** 抽屉内选择一条原支出。退款首屏按当前商家筛选，搜素始终跨商家。 */
export function TransactionLinkCandidatePanel({
  accountCurrency,
  amount,
  kind,
  merchantId,
  loadInitialViewAction,
  loadGroupItemsAction,
  loadMoreGroupsAction,
  loadSearchPageAction,
  onAmountChange,
  onChange,
  value,
}: TransactionLinkCandidatePanelProps) {
  const [view, setView] = useState<TransactionTimeGroupViewData | null>(null);
  const [browseMerchantId, setBrowseMerchantId] = useState<string | undefined>(merchantId);
  const [loading, setLoading] = useState(false);
  const [browseError, setBrowseError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const [searchRetryKey, setSearchRetryKey] = useState(0);
  const [query, setQuery] = useState("");
  const [searchPage, setSearchPage] = useState<TransactionSearchPage | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    if (!loadInitialViewAction) return;
    let cancelled = false;
    setLoading(true);
    setBrowseError(false);
    setView(null);
    setBrowseMerchantId(merchantId);
    void (async () => {
      try {
        let nextView = await loadInitialViewAction(merchantId);
        let appliedMerchantId = merchantId;
        // 没有这家商家的支出时退回全部；报销从来不按商家筛选。
        if (merchantId && nextView.groups.length === 0) {
          nextView = await loadInitialViewAction();
          appliedMerchantId = undefined;
        }
        if (!cancelled) {
          setBrowseMerchantId(appliedMerchantId);
          setView(nextView);
        }
      } catch {
        if (!cancelled) setBrowseError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [loadInitialViewAction, merchantId, retryKey]);

  useEffect(() => {
    const term = query.trim();
    if (!term || !loadSearchPageAction) {
      setSearchPage(null);
      return;
    }
    let cancelled = false;
    setSearchPage(null);
    setSearchLoading(true);
    setSearchError(false);
    const timeout = setTimeout(() => {
      void loadSearchPageAction(term, 0)
        .then((page) => { if (!cancelled) setSearchPage(page); })
        .catch(() => { if (!cancelled) setSearchError(true); })
        .finally(() => { if (!cancelled) setSearchLoading(false); });
    }, 250);
    return () => { cancelled = true; clearTimeout(timeout); };
  }, [loadSearchPageAction, query, searchRetryKey]);

  async function loadMore() {
    const nextOffset = searchPage?.nextOffset;
    if (nextOffset == null || loadingMore || !loadSearchPageAction) return;
    setLoadingMore(true);
    setSearchError(false);
    try {
      const page = await loadSearchPageAction(query.trim(), nextOffset);
      setSearchPage((previous) => previous ? {
        items: [...previous.items, ...page.items.filter(
          (item) => !previous.items.some((existing) => existing.id === item.id),
        )],
        nextOffset: page.nextOffset,
        totalCount: page.totalCount,
      } : page);
    } catch {
      setSearchError(true);
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
        placeholder="搜索原支出（全部商家）"
        size="small"
        slotProps={{
          htmlInput: { "aria-label": "搜索原支出" },
          input: { startAdornment: (
            <InputAdornment position="start"><SearchRoundedIcon fontSize="small" /></InputAdornment>
          ) },
        }}
        value={query}
      />
      <Stack sx={{ maxHeight: 290, minHeight: 160, overflowY: "auto" }}>
        {searching ? (
          searchLoading ? <CircularProgress size={24} /> :
          searchPage ? (
            <>
              {searchPage.items.length ? (
                <TransactionRefundCandidateList items={searchPage.items} {...candidateListProps} />
              ) : <Typography color="textSecondary">没有找到可关联的支出。</Typography>}
              {searchPage.nextOffset !== null ? (
                <Button disabled={loadingMore} onClick={() => void loadMore()}>
                  {loadingMore ? "加载中…" : "加载更多"}
                </Button>
              ) : null}
            </>
          ) : null
        ) : loading ? <CircularProgress size={24} /> :
        view ? view.groups.length === 0 ? (
          <Typography color="textSecondary" variant="body2">
            没有可关联的原支出，试试搜索。
          </Typography>
        ) : (
          <TransactionMonthList
            key={browseMerchantId ?? "all"}
            loadGroupItemsAction={loadGroupItemsAction
              ? (groupKey, offset) => loadGroupItemsAction(groupKey, offset, browseMerchantId)
              : undefined}
            loadMoreGroupsAction={loadMoreGroupsAction
              ? (offset) => loadMoreGroupsAction(offset, browseMerchantId)
              : undefined}
            onSelectRefundItem={kind === "refund" ? onChange : undefined}
            onSelectReimbursementItem={kind === "reimbursement" ? onChange : undefined}
            refundSelectionMode={kind === "refund"}
            reimbursementSelectionMode={kind === "reimbursement"}
            selectableCurrency={accountCurrency}
            selectedRefundItemId={kind === "refund" ? value?.id : null}
            selectedReimbursementItemId={kind === "reimbursement" ? value?.id : null}
            timeGroupView={view}
          />
        ) : null}
        {browseError || searchError ? (
          <Button onClick={() => searching
            ? setSearchRetryKey((value) => value + 1)
            : setRetryKey((value) => value + 1)}>
            加载失败，点击重试
          </Button>
        ) : null}
      </Stack>
      {value ? (
        <Typography variant="caption" color="textSecondary">
          已选择：{value.categoryName}
        </Typography>
      ) : (
        <Typography variant="caption" color="textSecondary">
          请先选择一笔原支出，再填写金额。
        </Typography>
      )}
      <TextField
        fullWidth
        disabled={!value}
        label={kind === "refund" ? "本次退款金额" : "本次报销金额"}
        onChange={(event) => onAmountChange(event.target.value)}
        size="small"
        slotProps={{ htmlInput: { inputMode: "decimal", "aria-label": "核销金额" } }}
        value={amount}
      />
    </Stack>
  );
}
