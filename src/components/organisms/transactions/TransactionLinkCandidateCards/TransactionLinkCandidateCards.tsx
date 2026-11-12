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
  resolveLinkCandidate,
  selectedId = null,
  selectionKind = "refund",
  showMerchantName = true,
}: {
  candidates: TransactionRefundCandidate[];
  onSelect: (item: TransactionRefundCandidate) => void;
  selectableCurrency?: string;
  resolveLinkCandidate?: (candidate: TransactionRefundCandidate) => TransactionRefundCandidate;
  selectedId?: string | null;
  selectionKind?: "refund" | "reimbursement";
  showMerchantName?: boolean;
}) {
  return (
    <Stack spacing={1}>
      {candidates.map((originalCandidate) => {
        const candidate = resolveLinkCandidate?.(originalCandidate) ?? originalCandidate;
        const refunded = Number(candidate.refundedAmount);
        const reimbursed = Number(candidate.reimbursementAmount ?? "0");
        const settled = Number(candidate.remainingRefundableAmount) <= 0;
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
            onClick={() => onSelect(originalCandidate)}
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
              <Typography variant="body2" sx={{ fontWeight: 700, color: settled ? "text.disabled" : "text.primary" }}>
                {currencySymbol}
                {formatNumber(candidate.amount, candidate.accountCurrency)}
              </Typography>
              {settled ? (
                <Typography variant="caption" sx={settledCandidateBadgeSx}>
                  {m.settledLabel(refunded > 0, reimbursed > 0)}
                </Typography>
              ) : (
                <>
                  {refunded > 0 ? (
                    <Typography variant="caption" sx={partialCandidateBadgeSx}>
                      {m.offsetLabel("refund", `${currencySymbol}${formatNumber(candidate.refundedAmount, candidate.accountCurrency)}`)}
                    </Typography>
                  ) : null}
                  {reimbursed > 0 ? (
                    <Typography variant="caption" sx={partialCandidateBadgeSx}>
                      {m.offsetLabel("reimbursement", `${currencySymbol}${formatNumber(candidate.reimbursementAmount ?? "0", candidate.accountCurrency)}`)}
                    </Typography>
                  ) : null}
                </>
              )}
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

const partialCandidateBadgeSx = {
  bgcolor: "var(--user-theme-business-pending-bg)",
  color: "var(--user-theme-business-pending-text)",
  borderRadius: `${designTokens.radius.full}px`,
  fontWeight: 700,
  mt: 0.5,
  px: 0.75,
  py: 0.125,
};
const settledCandidateBadgeSx = {
  ...partialCandidateBadgeSx,
  bgcolor: "var(--user-theme-business-completed-bg)",
  color: "var(--user-theme-business-completed-text)",
};
