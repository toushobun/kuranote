"use client";
import ExpandLessRoundedIcon from "@mui/icons-material/ExpandLessRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { designTokens } from "theme/theme";
import { isLinkCandidateSettled } from "internal/transaction";
import { transactionLinkCandidateMessages as m } from "config/transactionStepFlowMessages";
import { mergeUniqueById } from "utils/collections";
import { LoadMoreOnVisible } from "molecules/ui/LoadMoreOnVisible/LoadMoreOnVisible";
import { TransactionLinkCandidateCards } from "../TransactionLinkCandidateCards/TransactionLinkCandidateCards";
import type { TransactionRefundCandidate } from "types/transactions";
import {
  useTransactionLinkCandidates,
  type LoadTransactionLinkCandidatePage,
} from "./useTransactionLinkCandidates";

type TransactionLinkCandidatePanelProps = {
  accountCurrency?: string;
  kind: "refund" | "reimbursement";
  merchantId?: string;
  merchantName?: string;
  loadPageAction?: LoadTransactionLinkCandidatePage;
  /** 小票中已保存 / 草稿关联涉及的少量原支出，用于本地实时调整分组。 */
  linkAffectedCandidates?: TransactionRefundCandidate[];
  onChange: (item: TransactionRefundCandidate | null) => void;
  resolveLinkCandidate?: (
    candidate: TransactionRefundCandidate,
  ) => TransactionRefundCandidate;
  value: TransactionRefundCandidate | null;
};

export function TransactionLinkCandidatePanel(
  props: TransactionLinkCandidatePanelProps,
) {
  const { accountCurrency, kind, merchantName, onChange, value } = props;
  const {
    query,
    setQuery,
    page,
    settledPage,
    settledExpanded,
    toggleSettled,
    loading,
    loadingMore,
    settledLoading,
    error,
    settledError,
    loadMore,
    loadMoreSettled,
    retry,
    retrySettled,
  } = useTransactionLinkCandidates(props);

  // 服务端只知道数据库状态。旧关联 / 未保存草稿带来的少量差异，
  // 通过已持有的候选在前端重分组，不为此额外发起首屏请求。
  function matchesCurrentScope(candidate: TransactionRefundCandidate) {
    if (accountCurrency && candidate.accountCurrency !== accountCurrency)
      return false;
    const term = query.trim().toLocaleLowerCase();
    if (!term) return true;
    return [
      candidate.categoryName,
      candidate.merchantName,
      candidate.accountName,
      candidate.amount,
      candidate.transactionAt,
    ].some((text) => text?.toLocaleLowerCase().includes(term));
  }
  const scopedAffected = (props.linkAffectedCandidates ?? []).filter(
    matchesCurrentScope,
  );
  const allCandidates = mergeUniqueById(
    mergeUniqueById(page?.items ?? [], settledPage?.items ?? []),
    scopedAffected,
  ).filter((candidate) => candidate.id !== value?.id);
  const activeCandidates = allCandidates.filter(
    (candidate) =>
      !isLinkCandidateSettled(
        props.resolveLinkCandidate?.(candidate) ?? candidate,
      ),
  );
  const settledCandidates = allCandidates.filter((candidate) =>
    isLinkCandidateSettled(
      props.resolveLinkCandidate?.(candidate) ?? candidate,
    ),
  );
  const settledDelta = scopedAffected.reduce((sum, candidate) => {
    const databaseSettled = isLinkCandidateSettled(candidate);
    const actualSettled = isLinkCandidateSettled(
      props.resolveLinkCandidate?.(candidate) ?? candidate,
    );
    return sum + Number(actualSettled) - Number(databaseSettled);
  }, 0);
  const selectedSettledInScope =
    !!page &&
    !!value &&
    matchesCurrentScope(value) &&
    isLinkCandidateSettled(props.resolveLinkCandidate?.(value) ?? value);
  const selectedOffset = selectedSettledInScope ? 1 : 0;
  const settledCount = Math.max(
    0,
    (page?.settledCount ?? 0) + settledDelta - selectedOffset,
  );
  const visibleCandidates = value
    ? [value, ...activeCandidates]
    : activeCandidates;
  const showMerchantName =
    kind === "reimbursement" ||
    Boolean(query.trim()) ||
    [...visibleCandidates, ...settledCandidates].some(
      (candidate) =>
        candidate.merchantName && candidate.merchantName !== merchantName,
    );
  const cardProps = {
    resolveLinkCandidate: props.resolveLinkCandidate,
    onSelect: onChange,
    selectableCurrency: accountCurrency,
    selectedId: value?.id,
    selectionKind: kind,
    showMerchantName,
  } as const;

  return (
    <Stack spacing={1.25} sx={{ mt: 1.5 }}>
      <TextField
        fullWidth
        onChange={(event) => setQuery(event.target.value)}
        placeholder={m.searchPlaceholder}
        size="small"
        value={query}
        slotProps={{
          htmlInput: { "aria-label": m.searchAria },
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchRoundedIcon fontSize="small" />
              </InputAdornment>
            ),
          },
        }}
      />
      <Stack
        direction="row"
        sx={{ justifyContent: "space-between", color: "text.secondary" }}
      >
        <Typography variant="caption">
          {kind === "reimbursement" ? m.pending : m.allExpenses}
        </Typography>
        <Typography variant="caption">{accountCurrency}</Typography>
      </Stack>
      <TransactionLinkCandidateCards
        candidates={visibleCandidates}
        {...cardProps}
      />
      {loading ? (
        <CircularProgress size={24} />
      ) : page && visibleCandidates.length === 0 && settledCount === 0 ? (
        <Typography color="textSecondary" variant="body2">
          {query.trim() ? m.noSearchResults : m.noCandidates}
        </Typography>
      ) : null}
      <LoadMoreOnVisible
        enabled={page?.nextOffset != null && !error}
        isLoading={loadingMore}
        onVisible={() => void loadMore()}
      />
      {error ? <Button onClick={retry}>{m.retry}</Button> : null}
      {page && settledCount > 0 ? (
        <Stack spacing={1}>
          <Button
            aria-expanded={settledExpanded}
            aria-label={m.settledGroup(settledCount)}
            fullWidth
            onClick={toggleSettled}
            sx={{
              border: 1,
              borderStyle: "dashed",
              borderColor: "divider",
              borderRadius: `${designTokens.radius.item}px`,
              bgcolor: "action.hover",
              color: "text.secondary",
              justifyContent: "space-between",
              minHeight: 52,
              px: 1.5,
              py: 1,
              textTransform: "none",
              "@media (hover: hover)": {
                "&:hover": { bgcolor: "action.selected" },
              },
            }}
          >
            <Typography component="span" variant="body2">
              {m.settledGroup(settledCount)}
            </Typography>
            <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
              <Typography component="span" variant="body2">
                {settledExpanded ? m.collapseSettled : m.expandSettled}
              </Typography>
              {settledExpanded ? (
                <ExpandLessRoundedIcon fontSize="small" />
              ) : (
                <ExpandMoreRoundedIcon fontSize="small" />
              )}
            </Stack>
          </Button>
          {settledExpanded ? (
            <>
              <TransactionLinkCandidateCards
                candidates={settledCandidates}
                {...cardProps}
              />
              {settledLoading ? <CircularProgress size={24} /> : null}
              <LoadMoreOnVisible
                enabled={settledPage?.nextOffset != null && !settledError}
                isLoading={settledLoading}
                onVisible={() => void loadMoreSettled()}
              />
              {settledError ? (
                <Button onClick={() => void retrySettled()}>{m.retry}</Button>
              ) : null}
            </>
          ) : null}
        </Stack>
      ) : null}
    </Stack>
  );
}
