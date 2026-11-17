"use client";
import { useTransactionOffsetEntry } from "../TransactionOffsetEntry/TransactionOffsetEntry";
import { useEffect, useState } from "react";
import ExpandLessRoundedIcon from "@mui/icons-material/ExpandLessRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import {
  isLinkCandidatePartiallySettled,
  isLinkCandidateSettled,
} from "internal/transaction";
import { transactionLinkCandidateMessages as m } from "config/transactionStepFlowMessages";
import { mergeUniqueById } from "utils/collections";
import { LoadMoreOnVisible } from "molecules/ui/LoadMoreOnVisible/LoadMoreOnVisible";
import { TransactionLinkCandidateCards } from "../TransactionLinkCandidateCards/TransactionLinkCandidateCards";
import type { TransactionRefundCandidate } from "types/transactions";
import {
  useTransactionLinkCandidates,
  type LoadTransactionLinkCandidatePage,
} from "./useTransactionLinkCandidates";
import {
  groupLinkCandidates,
  matchesLinkCandidateScope,
  reconcileLinkCandidateGroupCounts,
  sortLinkCandidates,
  type LinkCandidateGroupKey,
} from "./transactionLinkCandidateUtils";
import { CandidateMonthSelector } from "./CandidateMonthSelector";
import { candidateInMonth, toTokyoCandidateMonth } from "./candidateMonth";

type TransactionLinkCandidatePanelProps = {
  accountCurrency?: string;
  pinInitialSelection?: boolean;
  kind: "refund" | "reimbursement";
  merchantId?: string;
  merchantName?: string;
  month?: string;
  onMonthChange?: (month: string) => void;
  loadPageAction?: LoadTransactionLinkCandidatePage;
  /** 小票中已保存 / 草稿关联涉及的少量原支出，用于本地实时调整分组。 */
  linkAffectedCandidates?: TransactionRefundCandidate[];
  onChange: (item: TransactionRefundCandidate | null) => void;
  resolveLinkCandidate?: (
    candidate: TransactionRefundCandidate,
  ) => TransactionRefundCandidate;
  value: TransactionRefundCandidate | null;
  lockedAmounts?: ReadonlyMap<string, string>;
};

export function TransactionLinkCandidatePanel(
  props: TransactionLinkCandidatePanelProps,
) {
  const source = useTransactionOffsetEntry();
  const sourceCandidates = source?.kind === props.kind ? source.candidates : [];
  const { accountCurrency, kind, merchantName, onChange, value } = props;
  // 只固定抽屉打开时已关联的原支出，后续改选不重新置顶。
  const [initialSelection] = useState(
    props.pinInitialSelection === false ? null : value,
  );
  const [localMonth, setLocalMonth] = useState(() =>
    toTokyoCandidateMonth(
      value?.transactionAt ?? sourceCandidates[0]?.transactionAt ?? new Date(),
    ),
  );
  const normalMonth = props.month ?? localMonth;
  const setNormalMonth = props.onMonthChange ?? setLocalMonth;
  const [expandedByKey, setExpandedByKey] = useState<
    Partial<Record<LinkCandidateGroupKey, boolean>>
  >({});
  const {
    query,
    setQuery,
    searchMonth,
    setSearchMonth,
    displayedMonth,
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
  } = useTransactionLinkCandidates({ ...props, month: normalMonth });
  const searching = query.trim().length > 0;

  const sourceItemIds = sourceCandidates.map((candidate) => candidate.id);
  const matchesCurrentScope = (candidate: TransactionRefundCandidate) =>
    matchesLinkCandidateScope(candidate, accountCurrency, query) &&
    (candidateInMonth(candidate.transactionAt, displayedMonth) ||
      !!props.lockedAmounts?.has(candidate.id) ||
      sourceItemIds.includes(candidate.id));
  const lockedLoaded = mergeUniqueById(
    page?.items ?? [],
    settledPage?.items ?? [],
  ).filter((candidate) => props.lockedAmounts?.has(candidate.id));
  const scopedAffected = mergeUniqueById(
    mergeUniqueById(props.linkAffectedCandidates ?? [], sourceCandidates),
    lockedLoaded,
  ).filter(matchesCurrentScope);
  const allCandidates = mergeUniqueById(
    mergeUniqueById(page?.items ?? [], settledPage?.items ?? []),
    scopedAffected,
  ).filter((candidate) => candidate.id !== initialSelection?.id);
  function isSettled(candidate: TransactionRefundCandidate) {
    return isLinkCandidateSettled(
      props.lockedAmounts?.has(candidate.id)
        ? candidate
        : (props.resolveLinkCandidate?.(candidate) ?? candidate),
    );
  }
  function isPartial(candidate: TransactionRefundCandidate) {
    return isLinkCandidatePartiallySettled(
      props.lockedAmounts?.has(candidate.id)
        ? candidate
        : (props.resolveLinkCandidate?.(candidate) ?? candidate),
    );
  }
  const historyMerchantIds = props.merchantId ? page?.historyMerchantIds : [];
  const orderOptions = {
    kind,
    merchantId: props.merchantId,
    historyMerchantIds,
    historyMerchantNames: page?.historyMerchantNames,
    lockedAmounts: props.lockedAmounts,
    sourceItemIds,
    isActuallyPartiallySettled: isPartial,
  } as const;
  function orderCandidates(settled: boolean) {
    return sortLinkCandidates(
      allCandidates.filter(
        (candidate) =>
          (props.lockedAmounts?.has(candidate.id)
            ? false
            : isSettled(candidate)) === settled,
      ),
      { ...orderOptions, settled },
    );
  }
  const activeCandidates = orderCandidates(false);
  const settledCandidates = orderCandidates(true);
  const settledDelta = scopedAffected
    .filter(
      (candidate) =>
        candidate.id !== initialSelection?.id &&
        candidateInMonth(candidate.transactionAt, displayedMonth),
    )
    .reduce(
      (sum, candidate) =>
        sum +
        Number(
          !props.lockedAmounts?.has(candidate.id) && isSettled(candidate),
        ) -
        Number(isLinkCandidateSettled(candidate)),
      0,
    );
  const selectedInScope =
    !!page &&
    !!initialSelection &&
    matchesLinkCandidateScope(initialSelection, accountCurrency, query) &&
    candidateInMonth(initialSelection.transactionAt, displayedMonth);
  const selectedSettledOffset =
    selectedInScope && isLinkCandidateSettled(initialSelection) ? 1 : 0;
  const settledCount = Math.max(
    0,
    (page?.settledCount ?? 0) + settledDelta - selectedSettledOffset,
    settledCandidates.length,
  );
  const groupCounts = reconcileLinkCandidateGroupCounts(page?.groupCounts, {
    ...orderOptions,
    affectedCandidates: scopedAffected.filter((candidate) =>
      candidateInMonth(candidate.transactionAt, displayedMonth),
    ),
    initialSelection: selectedInScope ? initialSelection : null,
    isActuallySettled: isSettled,
  });
  const groups = groupLinkCandidates(activeCandidates, {
    ...orderOptions,
    merchantName,
    sourceCandidate: sourceCandidates[0],
    counts: {
      ...groupCounts,
      locked: activeCandidates.filter((candidate) =>
        props.lockedAmounts?.has(candidate.id),
      ).length,
      source: activeCandidates.filter(
        (candidate) =>
          !props.lockedAmounts?.has(candidate.id) &&
          sourceItemIds.includes(candidate.id),
      ).length,
    },
  });
  // 入口 B 的旧月份来源仍显示，但不能掩盖当前月份没有候选的事实。
  const hasCurrentMonthCandidates =
    activeCandidates.some((candidate) =>
      candidateInMonth(candidate.transactionAt, displayedMonth),
    ) ||
    settledCount > 0 ||
    Object.values(groupCounts ?? {}).some((count) => (count ?? 0) > 0);
  const showEmptyMessage = searching
    ? !initialSelection && activeCandidates.length === 0 && settledCount === 0
    : !hasCurrentMonthCandidates;
  const defaultGroupKey = groups.find(
    (group) => group.key !== "locked" && group.key !== "partial",
  )?.key;
  const isGroupExpanded = (key: LinkCandidateGroupKey) =>
    expandedByKey[key] ??
    (key !== "locked" && key !== "partial" && key === defaultGroupKey);
  const waitingGroupKey = !searching
    ? groups.find(
        (group) =>
          group.key !== "locked" &&
          isGroupExpanded(group.key) &&
          group.count > 0 &&
          group.candidates.length === 0,
      )?.key
    : undefined;

  // 展开后面的组时，按数据库顺序依次读完前面组的页，直到目标组有卡片。
  useEffect(() => {
    if (waitingGroupKey && page?.nextOffset != null && !loadingMore && !error)
      void loadMore();
  }, [waitingGroupKey, page?.nextOffset, loadingMore, error, loadMore]);

  const showMerchantName =
    kind === "reimbursement" ||
    searching ||
    [
      ...activeCandidates,
      ...settledCandidates,
      ...(initialSelection ? [initialSelection] : []),
    ].some(
      (candidate) =>
        candidate.merchantName && candidate.merchantName !== merchantName,
    );
  const cardProps = {
    resolveLinkCandidate: props.resolveLinkCandidate,
    onSelect: onChange,
    selectableCurrency: accountCurrency,
    lockedAmounts: props.lockedAmounts,
    selectedId: value?.id,
    selectionKind: kind,
    showMerchantName,
  } as const;

  return (
    <Stack spacing={1.25} sx={{ mt: 1.5 }}>
      <TextField
        fullWidth
        onChange={(event) => {
          const nextQuery = event.target.value;
          if (searching !== Boolean(nextQuery.trim())) {
            setExpandedByKey({});
            if (!searching) setSearchMonth(null);
          }
          setQuery(nextQuery);
        }}
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
      <CandidateMonthSelector
        month={searching ? searchMonth : normalMonth}
        searching={searching}
        onChange={(next) => {
          setExpandedByKey({});
          if (searching) setSearchMonth(next);
          else if (next !== null) setNormalMonth(next);
        }}
      />
      {initialSelection ? (
        <TransactionLinkCandidateCards
          candidates={[initialSelection]}
          {...cardProps}
        />
      ) : null}
      {searching ? (
        <>
          <TransactionLinkCandidateCards
            candidates={activeCandidates}
            {...cardProps}
          />
          <LoadMoreOnVisible
            enabled={page?.nextOffset != null && !error}
            isLoading={loadingMore}
            onVisible={() => void loadMore()}
          />
        </>
      ) : (
        groups.map((group) => {
          const expanded = isGroupExpanded(group.key);
          return (
            <Stack key={group.key} spacing={0.75}>
              <CandidateGroupHeading
                title={group.title}
                hint={group.hint}
                count={group.count}
                expanded={expanded}
                onClick={() =>
                  setExpandedByKey((state) => ({
                    ...state,
                    [group.key]: !expanded,
                  }))
                }
              />
              {expanded ? (
                <>
                  <TransactionLinkCandidateCards
                    candidates={group.candidates}
                    {...cardProps}
                  />
                  {group.key !== "locked" ? (
                    <LoadMoreOnVisible
                      enabled={
                        page?.nextOffset != null &&
                        !error &&
                        (page?.groupCounts === undefined ||
                          group.candidates.length < group.count)
                      }
                      isLoading={loadingMore}
                      onVisible={() => void loadMore()}
                    />
                  ) : null}
                </>
              ) : null}
            </Stack>
          );
        })
      )}
      {loading ? <CircularProgress size={24} /> : null}
      {page && showEmptyMessage ? (
        <Typography color="textSecondary" variant="body2">
          {searching ? m.noSearchResults : m.monthEmpty}
        </Typography>
      ) : null}
      {error ? <Button onClick={retry}>{m.retry}</Button> : null}
      {page && settledCount > 0 ? (
        <Stack spacing={0.75}>
          <CandidateGroupHeading
            title={m.settledTitle}
            count={settledCount}
            ariaLabel={m.settledGroup(settledCount)}
            expanded={settledExpanded}
            onClick={toggleSettled}
          />
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

function CandidateGroupHeading({
  title,
  hint,
  count,
  ariaLabel,
  expanded,
  onClick,
}: {
  title: string;
  hint?: string;
  count: number;
  ariaLabel?: string;
  expanded: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      aria-expanded={expanded}
      aria-label={ariaLabel ?? m.groupAriaLabel(title, count)}
      fullWidth
      onClick={onClick}
      sx={{
        borderBottom: 1,
        borderColor: "divider",
        borderRadius: 0,
        color: "text.secondary",
        justifyContent: "space-between",
        minHeight: 44,
        px: 0.5,
        py: 0.75,
        textTransform: "none",
        "@media (hover: hover)": {
          "&:hover": { bgcolor: "action.hover" },
        },
      }}
    >
      <Stack
        direction="row"
        spacing={0.75}
        sx={{ minWidth: 0, alignItems: "center", flex: 1 }}
      >
        <Typography
          component="span"
          variant="body2"
          sx={{ flexShrink: 0, color: "text.primary", fontWeight: 700 }}
        >
          {title}
        </Typography>
        {hint ? (
          <Typography
            component="span"
            variant="caption"
            noWrap
            sx={{ minWidth: 0, color: "text.disabled" }}
          >
            {hint}
          </Typography>
        ) : null}
      </Stack>
      <Stack
        direction="row"
        spacing={0.5}
        sx={{ ml: 0.5, flexShrink: 0, alignItems: "center" }}
      >
        <Typography component="span" variant="caption">
          {m.groupCount(count)}
        </Typography>
        <Typography component="span" variant="caption">
          {expanded ? m.collapse : m.expand}
        </Typography>
        {expanded ? (
          <ExpandLessRoundedIcon fontSize="small" />
        ) : (
          <ExpandMoreRoundedIcon fontSize="small" />
        )}
      </Stack>
    </Button>
  );
}
