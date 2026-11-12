"use client";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { transactionLinkCandidateMessages as m } from "config/transactionStepFlowMessages";
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
  onChange: (item: TransactionRefundCandidate | null) => void;
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
    browseMerchantId,
    loading,
    loadingMore,
    error,
    loadMore,
    retry,
  } = useTransactionLinkCandidates(props);
  const candidates = value
    ? [value, ...(page?.items ?? []).filter((item) => item.id !== value.id)]
    : (page?.items ?? []);
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
          {kind === "reimbursement"
            ? m.pending
            : browseMerchantId && !query.trim()
              ? m.merchantExpenses(merchantName ?? "")
              : m.allExpenses}
        </Typography>
        <Typography variant="caption">{accountCurrency}</Typography>
      </Stack>
      <TransactionLinkCandidateCards
        candidates={candidates}
        onSelect={onChange}
        selectableCurrency={accountCurrency}
        selectedId={value?.id}
        selectionKind={kind}
        showMerchantName={
          kind === "reimbursement" ||
          !browseMerchantId ||
          Boolean(query.trim()) ||
          candidates.some(
            (candidate) =>
              candidate.merchantName && candidate.merchantName !== merchantName,
          )
        }
      />
      {loading ? (
        <CircularProgress size={24} />
      ) : page && candidates.length === 0 ? (
        <Typography color="textSecondary" variant="body2">
          {query.trim() ? m.noSearchResults : m.noCandidates}
        </Typography>
      ) : null}
      {page?.nextOffset != null ? (
        <Button disabled={loadingMore} onClick={() => void loadMore()}>
          {loadingMore ? m.loading : m.loadMore}
        </Button>
      ) : null}
      {error ? <Button onClick={retry}>{m.retry}</Button> : null}
    </Stack>
  );
}
