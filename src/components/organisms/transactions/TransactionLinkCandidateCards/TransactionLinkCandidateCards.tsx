"use client";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import ButtonBase from "@mui/material/ButtonBase";
import Radio from "@mui/material/Radio";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { alpha, type Theme } from "@mui/material/styles";
import { MerchantAvatar } from "organisms/merchants/MerchantAvatar/MerchantAvatar";
import { designTokens } from "theme/theme";
import { transactionLinkCandidateMessages as m } from "config/transactionStepFlowMessages";
import type { TransactionRefundCandidate } from "types/transactions";
import { getCurrencySymbol } from "utils/currency";
import { transactionLinkMessages } from "utils/transactionMessages";
import {
  formatNumber,
  formatDateKey,
  hasLinkCandidateCurrencyMismatch,
} from "utils/transactions";

export function TransactionLinkCandidateCards({
  candidates,
  onSelect,
  selectableCurrency,
  selectedId = null,
  selectionKind = "refund",
  showMerchantName = true,
}: {
  candidates: TransactionRefundCandidate[];
  onSelect: (item: TransactionRefundCandidate) => void;
  selectableCurrency?: string;
  selectedId?: string | null;
  selectionKind?: "refund" | "reimbursement";
  showMerchantName?: boolean;
}) {
  const isReimbursement = selectionKind === "reimbursement";

  return (
    <Stack spacing={1}>
      {candidates.map((candidate) => {
        const selected = selectedId === candidate.id;
        const currencySymbol = getCurrencySymbol(candidate.accountCurrency);
        const currencyMismatchReason =
          selectableCurrency !== undefined &&
          hasLinkCandidateCurrencyMismatch(candidate, selectableCurrency)
            ? transactionLinkMessages.candidateCurrencyMismatchReason(
                selectableCurrency,
              )
            : null;
        const subtitle = [
          ...(showMerchantName
            ? [candidate.merchantName || m.unassignedMerchant]
            : []),
          formatDateKey(candidate.transactionAt).slice(5).replace("-", "/"),
          candidate.accountName,
        ]
          .filter(Boolean)
          .join(" · ");
        const isCurrencyMismatched = currencyMismatchReason !== null;
        return (
          <ButtonBase
            aria-label={m.selectCandidate(
              selectionKind,
              candidate.categoryName,
            )}
            aria-pressed={selected}
            disabled={isCurrencyMismatched}
            key={candidate.id}
            onClick={() => onSelect(candidate)}
            sx={{
              ...refundCandidateSx,
              border: 1,
              borderColor: selected ? "primary.main" : "divider",
              bgcolor: selected
                ? (theme: Theme) => alpha(theme.palette.primary.main, 0.08)
                : "background.paper",
            }}
          >
            <MerchantAvatar
              size={40}
              toneKey={candidate.merchantName ?? candidate.id}
              src={candidate.merchantIconUrl ?? undefined}
            />
            <Stack sx={{ flex: 1, minWidth: 0, textAlign: "left" }}>
              <Typography sx={{ fontWeight: 700 }} variant="body2" noWrap>
                {candidate.categoryName}
              </Typography>
              <Typography
                color="textSecondary"
                variant="caption"
                noWrap
                title={subtitle}
              >
                {subtitle}
              </Typography>
              {currencyMismatchReason ? (
                <Typography color="textSecondary" variant="caption">
                  {currencyMismatchReason}
                </Typography>
              ) : null}
            </Stack>
            <Stack sx={{ alignItems: "flex-end", flexShrink: 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {currencySymbol}
                {formatNumber(candidate.amount, candidate.accountCurrency)}
              </Typography>
              {Number(
                isReimbursement
                  ? candidate.reimbursementAmount
                  : candidate.refundedAmount,
              ) > 0 ? (
                <Typography color="textSecondary" variant="caption">
                  {m.offsetLabel(
                    selectionKind,
                    `${currencySymbol}${formatNumber((isReimbursement ? candidate.reimbursementAmount : candidate.refundedAmount) ?? "0", candidate.accountCurrency)}`,
                  )}
                </Typography>
              ) : null}
            </Stack>
            <Radio
              checked={selected}
              checkedIcon={
                <CheckRoundedIcon
                  sx={{
                    bgcolor: "primary.main",
                    color: "primary.contrastText",
                    borderRadius: "50%",
                    p: 0.25,
                  }}
                />
              }
              disabled={isCurrencyMismatched}
              tabIndex={-1}
              sx={{ p: 0, pointerEvents: "none" }}
            />
          </ButtonBase>
        );
      })}
    </Stack>
  );
}
const refundCandidateSx = {
  alignItems: "center",
  display: "flex",
  borderRadius: `${designTokens.radius.item}px`,
  gap: 1.25,
  justifyContent: "space-between",
  minHeight: 64,
  px: 1.25,
  py: 1.5,
  width: "100%",
  "&.Mui-disabled": {
    opacity: (theme: Theme) => theme.palette.action.disabledOpacity,
  },
};
