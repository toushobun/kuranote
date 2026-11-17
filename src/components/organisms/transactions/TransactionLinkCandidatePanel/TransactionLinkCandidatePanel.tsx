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
import {
  groupLinkCandidates,
  matchesLinkCandidateScope,
  reconcileLinkCandidateGroupCounts,
  sortLinkCandidates,
  type LinkCandidateGroupKey,
} from "./transactionLinkCandidateUtils";

type TransactionLinkCandidatePanelProps = {
  accountCurrency?: string;
  pinInitialSelection?: boolean;
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
  const [expandedByKey, setExpandedByKey] = useState<
    Partial<Record<LinkCandidateGroupKey, boolean>>
  >({});
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
  const searching = query.trim().length > 0;

  const matchesCurrentScope = (candidate: TransactionRefundCandidate) =>
    matchesLinkCandidateScope(candidate, accountCurrency, query);
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
  const sourceItemIds = sourceCandidates.map((candidate) => candidate.id);
  const historyMerchantIds = props.merchantId ? page?.historyMerchantIds : [];
  const orderOptions = {
    kind,
    merchantId: props.merchantId,
    historyMerchantIds,
    lockedAmounts: props.lockedAmounts,
    sourceItemIds,
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
    .filter((candidate) => candidate.id !== initialSelection?.id)
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
    !!page && !!initialSelection && matchesCurrentScope(initialSelection);
  const selectedSettledOffset =
    selectedInScope && isLinkCandidateSettled(initialSelection) ? 1 : 0;
  const settledCount = Math.max(
    0,
    (page?.settledCount ?? 0) + settledDelta - selectedSettledOffset,
    settledCandidates.length,
  );
  const groupCounts = reconcileLinkCandidateGroupCounts(page?.groupCounts, {
    ...orderOptions,
    affectedCandidates: scopedAffected,
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
  const defaultGroupKey = groups.find((group) => group.key !== "locked")?.key;
  const isGroupExpanded = (key: LinkCandidateGroupKey) =>
    expandedByKey[key] ?? (key !== "locked" && key === defaultGroupKey);
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
          if (searching !== Boolean(nextQuery.trim())) setExpandedByKey({});
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
      {page &&
      !initialSelection &&
      activeCandidates.length === 0 &&
      settledCount === 0 ? (
        <Typography color="textSecondary" variant="body2">
          {searching ? m.noSearchResults : m.noCandidates}
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
        <Typography component="span" variant="body2" sx={{ flexShrink: 0 }}>
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
          {expanded ? m.collapseSettled : m.expandSettled}
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
