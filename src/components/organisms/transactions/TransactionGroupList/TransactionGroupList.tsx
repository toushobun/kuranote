"use client";

import { useEffect, useState } from "react";

import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Radio from "@mui/material/Radio";
import Stack from "@mui/material/Stack";
import type { Theme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";

import { transactionEditHref } from "config/paths";
import { TransactionRowLink } from "molecules/transactions/TransactionRowLink";
import { userThemeCardBorder } from "theme/userThemeCardSx";
import type {
  TransactionDateGroup,
  TransactionListItem,
  TransactionRefundCandidate,
} from "types/transactions";
import { getCurrencySymbol } from "utils/currency";
import { transactionLinkMessages } from "utils/transactionMessages";
import {
  formatDateLabel,
  formatNumber,
  getDateLabelRefreshDelayMs,
  hasLinkCandidateCurrencyMismatch,
} from "utils/transactions";

type TransactionGroupListProps = {
  groups: TransactionDateGroup[];
  onSelectRefundItem?: (item: TransactionRefundCandidate) => void;
  onSelectReimbursementItem?: (item: TransactionRefundCandidate) => void;
  refundSelectionMode?: boolean;
  reimbursementSelectionMode?: boolean;
  selectableCurrency?: string;
  selectedRefundItemId?: string | null;
  selectedReimbursementItemId?: string | null;
  sharedPaymentSubject?: string;
  showSummary?: boolean;
};

export function TransactionGroupList({
  groups,
  onSelectRefundItem,
  onSelectReimbursementItem,
  refundSelectionMode = false,
  reimbursementSelectionMode = false,
  selectableCurrency,
  selectedRefundItemId = null,
  selectedReimbursementItemId = null,
  sharedPaymentSubject,
  showSummary = true,
}: TransactionGroupListProps) {
  useDateGroupLabelRefresh();

  return (
    <Stack sx={{ gap: 0 }}>
      {groups.map((group, groupIndex) => (
        <Stack key={group.date} spacing={0.55}>
          {groupIndex > 0 ? (
            <Box aria-hidden="true" sx={{ borderTop: userThemeCardBorder }} />
          ) : null}

          <Stack
            direction="row"
            spacing={2}
            sx={{ alignItems: "center", justifyContent: "space-between" }}
          >
            <Stack
              direction="row"
              spacing={1.1}
              sx={{ alignItems: "center", flex: 1, minWidth: 0 }}
            >
              <Typography
                sx={{ color: "text.primary", fontSize: 15, fontWeight: 700 }}
              >
                {formatDateLabel(group.date)}
              </Typography>
              <Box
                sx={{
                  bgcolor: "var(--user-theme-card-border)",
                  flex: 1,
                  height: 1,
                }}
              />
            </Stack>
            {showSummary ? (
              <Typography
                sx={{
                  color: "text.secondary",
                  fontSize: 12,
                  fontWeight: 900,
                }}
              >
                {getGroupSummaryText(group)}
              </Typography>
            ) : null}
          </Stack>

          <Box>
            {reimbursementSelectionMode && onSelectReimbursementItem ? (
              <TransactionRefundCandidateList
                items={group.items}
                onSelect={onSelectReimbursementItem}
                selectableCurrency={selectableCurrency}
                selectedId={selectedReimbursementItemId}
                selectionKind="reimbursement"
              />
            ) : refundSelectionMode && onSelectRefundItem ? (
              <TransactionRefundCandidateList
                items={group.items}
                onSelect={onSelectRefundItem}
                selectableCurrency={selectableCurrency}
                selectedId={selectedRefundItemId}
              />
            ) : (
              group.items.map((item, itemIndex) => (
                <TransactionRowLink
                  href={transactionEditHref(item.id)}
                  item={item}
                  key={item.id}
                  sharedPaymentSubject={sharedPaymentSubject}
                  showDivider={itemIndex < group.items.length - 1}
                />
              ))
            )}
          </Box>
        </Stack>
      ))}
    </Stack>
  );
}

export function TransactionRefundCandidateList({
  items,
  onSelect,
  selectableCurrency,
  selectedId = null,
  selectionKind = "refund",
}: {
  items: TransactionListItem[];
  onSelect: (item: TransactionRefundCandidate) => void;
  // 指定时，与该币种不一致的候选置灰且不可选择。
  selectableCurrency?: string;
  selectedId?: string | null;
  selectionKind?: "refund" | "reimbursement";
}) {
  const candidates = items.flatMap((record) =>
    record.categoryItems.flatMap((item) => {
      if (
        item.categoryType !== "expense" ||
        !item.id ||
        item.remainingRefundableAmount === undefined
      ) {
        return [];
      }
      return [
        {
          // 记录币种（普通记录取付款账户币种），只用于判断候选是否可选。
          accountCurrency: record.account_currency,
          amount: item.amount,
          categoryName: item.categoryName,
          id: item.id,
          parentCategoryName: item.parentCategoryName,
          refundedAmount: item.refundedAmount ?? "0",
          remainingRefundableAmount: item.remainingRefundableAmount,
          transactionAt: record.transaction_at,
          transactionRecordId: record.id,
        } satisfies TransactionRefundCandidate,
      ];
    }),
  );
  const isReimbursement = selectionKind === "reimbursement";

  return (
    <Stack>
      {candidates.map((candidate, index) => {
        const selected = selectedId === candidate.id;
        const currencySymbol = getCurrencySymbol(candidate.accountCurrency);
        const currencyMismatchReason =
          selectableCurrency !== undefined &&
          hasLinkCandidateCurrencyMismatch(candidate, selectableCurrency)
            ? transactionLinkMessages.candidateCurrencyMismatchReason(
                selectableCurrency,
              )
            : null;
        const isCurrencyMismatched = currencyMismatchReason !== null;
        return (
          <ButtonBase
            aria-label={`${isReimbursement ? "选择报销明细" : "选择退款明细"} ${candidate.categoryName}`}
            aria-pressed={selected}
            disabled={isCurrencyMismatched}
            key={candidate.id}
            onClick={() => onSelect(candidate)}
            sx={{
              ...refundCandidateSx,
              borderBottom:
                index === candidates.length - 1 ? "none" : userThemeCardBorder,
            }}
          >
            <Radio
              checked={selected}
              disabled={isCurrencyMismatched}
              tabIndex={-1}
            />
            <Stack sx={{ flex: 1, minWidth: 0, textAlign: "left" }}>
              <Typography sx={{ fontWeight: 800 }} variant="body2">
                {candidate.parentCategoryName
                  ? `${candidate.parentCategoryName} / ${candidate.categoryName}`
                  : candidate.categoryName}
              </Typography>
              <Typography color="textSecondary" variant="caption">
                原始金额 {currencySymbol}
                {formatNumber(candidate.amount, candidate.accountCurrency)}
              </Typography>
              {currencyMismatchReason ? (
                <Typography color="textSecondary" variant="caption">
                  {currencyMismatchReason}
                </Typography>
              ) : null}
            </Stack>
            <Stack sx={{ alignItems: "flex-end" }}>
              <Typography sx={{ fontWeight: 900 }} variant="body2">
                {isReimbursement ? "剩余可核销" : "剩余可退"} {currencySymbol}
                {formatNumber(
                  candidate.remainingRefundableAmount,
                  candidate.accountCurrency,
                )}
              </Typography>
              {!isReimbursement && Number(candidate.refundedAmount) > 0 ? (
                <Typography color="textSecondary" variant="caption">
                  已退款 {currencySymbol}
                  {formatNumber(
                    candidate.refundedAmount,
                    candidate.accountCurrency,
                  )}
                </Typography>
              ) : null}
            </Stack>
          </ButtonBase>
        );
      })}
    </Stack>
  );
}

function useDateGroupLabelRefresh() {
  const [, setRefreshKey] = useState(0);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const scheduleNextRefresh = () => {
      timeoutId = setTimeout(() => {
        setRefreshKey((current) => current + 1);
        scheduleNextRefresh();
      }, getDateLabelRefreshDelayMs(new Date()));
    };

    scheduleNextRefresh();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);
}

const refundCandidateSx = {
  alignItems: "center",
  display: "flex",
  gap: 0.75,
  justifyContent: "space-between",
  minHeight: 64,
  px: 0.75,
  py: 0.75,
  width: "100%",
  "&.Mui-disabled": {
    opacity: (theme: Theme) => theme.palette.action.disabledOpacity,
  },
};

function getGroupSummaryText(group: TransactionDateGroup) {
  const expense = Number(group.summary.expense);
  const income = Number(group.summary.income);
  const currencySymbol = getCurrencySymbol(group.summary.currency);

  if (income > 0 && expense > 0) {
    return `收入 ${currencySymbol}${formatNumber(group.summary.income, group.summary.currency)} / 支出 ${currencySymbol}${formatNumber(
      group.summary.expense,
      group.summary.currency,
    )} / 合计 ${formatSignedAmount(group.summary.balance, group.summary.currency)}`;
  }

  if (expense > 0) {
    return `支出 ${currencySymbol}${formatNumber(group.summary.expense, group.summary.currency)}`;
  }

  if (income > 0) {
    return `收入 ${currencySymbol}${formatNumber(group.summary.income, group.summary.currency)}`;
  }

  return `合计 ${formatSignedAmount(group.summary.balance, group.summary.currency)}`;
}

function formatSignedAmount(amount: string, currency: string) {
  const currencySymbol = getCurrencySymbol(currency);
  const value = Number(amount);

  if (!Number.isFinite(value))
    return `${currencySymbol}${formatNumber(amount, currency)}`;
  if (value === 0) return `${currencySymbol}0`;

  const sign = value > 0 ? "+" : "-";
  return `${sign}${currencySymbol}${formatNumber(String(Math.abs(value)), currency)}`;
}
