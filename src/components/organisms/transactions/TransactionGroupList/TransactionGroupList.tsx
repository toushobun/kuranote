"use client";
import { toTransactionLinkCandidates } from "internal/transaction";
import { TransactionLinkCandidateCards } from "../TransactionLinkCandidateCards/TransactionLinkCandidateCards";

import { useEffect, useState } from "react";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
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
import {
  formatDateLabel,
  formatNumber,
  getDateLabelRefreshDelayMs,
} from "utils/transactions";

type TransactionGroupListProps = {
  groups: TransactionDateGroup[];
  showSummary?: boolean;
};

export function TransactionGroupList({
  groups,
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
            {group.items.map((item, itemIndex) => (
              <TransactionRowLink
                href={transactionEditHref(item.id)}
                item={item}
                key={item.id}
                showDivider={itemIndex < group.items.length - 1}
              />
            ))}
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
  return (
    <TransactionLinkCandidateCards
      candidates={toTransactionLinkCandidates(items)}
      onSelect={onSelect}
      selectableCurrency={selectableCurrency}
      selectedId={selectedId}
      selectionKind={selectionKind}
    />
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
