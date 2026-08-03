"use client";

import { useEffect, useState } from "react";

import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Link from "next/link";

import { transactionEditHref } from "config/paths";
import { TransactionRow } from "molecules/transactions/TransactionRow";
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
  onSelectRefundItem?: (item: TransactionRefundCandidate) => void;
  refundSelectionMode?: boolean;
  showSummary?: boolean;
};

export function TransactionGroupList({
  groups,
  onSelectRefundItem,
  refundSelectionMode = false,
  showSummary = true,
}: TransactionGroupListProps) {
  useDateGroupLabelRefresh();

  return (
    <Stack spacing={1.2}>
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
            {refundSelectionMode && onSelectRefundItem ? (
              <TransactionRefundCandidateList
                items={group.items}
                onSelect={onSelectRefundItem}
              />
            ) : (
              group.items.map((item, itemIndex) => (
                <TransactionListRow
                  isLastItem={itemIndex === group.items.length - 1}
                  item={item}
                  key={item.id}
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
}: {
  items: TransactionListItem[];
  onSelect: (item: TransactionRefundCandidate) => void;
}) {
  const candidates = items.flatMap((record) =>
    record.categoryItems.flatMap((item) => {
      if (
        item.categoryType !== "expense" ||
        !item.id ||
        !record.account_id
      )
        return [];
      return [
        {
          accountCurrency: record.account_currency,
          accountId: record.account_id,
          amount: item.amount,
          categoryName: item.categoryName,
          id: item.id,
          parentCategoryName: item.parentCategoryName,
          refundedAmount: item.refundedAmount ?? "0",
          remainingRefundableAmount:
            item.remainingRefundableAmount ?? item.amount,
          transactionAt: record.transaction_at,
          transactionRecordId: record.id,
        } satisfies TransactionRefundCandidate,
      ];
    }),
  );

  return (
    <Stack>
      {candidates.map((candidate, index) => {
        const disabled = Number(candidate.remainingRefundableAmount) <= 0;
        const currencySymbol = getCurrencySymbol(candidate.accountCurrency);
        return (
          <ButtonBase
            aria-label={`选择退款明细 ${candidate.categoryName}`}
            disabled={disabled}
            key={candidate.id}
            onClick={() => onSelect(candidate)}
            sx={{
              ...refundCandidateSx,
              borderBottom:
                index === candidates.length - 1 ? "none" : userThemeCardBorder,
              opacity: disabled ? 0.45 : 1,
            }}
          >
            <Stack sx={{ minWidth: 0, textAlign: "left" }}>
              <Typography sx={{ fontWeight: 800 }} variant="body2">
                {candidate.parentCategoryName
                  ? `${candidate.parentCategoryName} / ${candidate.categoryName}`
                  : candidate.categoryName}
              </Typography>
              <Typography color="text.secondary" variant="caption">
                原始金额 {currencySymbol}
                {formatNumber(candidate.amount)}
              </Typography>
            </Stack>
            <Stack sx={{ alignItems: "flex-end" }}>
              <Typography sx={{ fontWeight: 900 }} variant="body2">
                剩余可退 {currencySymbol}
                {formatNumber(candidate.remainingRefundableAmount)}
              </Typography>
              {Number(candidate.refundedAmount) > 0 ? (
                <Typography color="text.secondary" variant="caption">
                  已退款 {currencySymbol}
                  {formatNumber(candidate.refundedAmount)}
                </Typography>
              ) : null}
            </Stack>
          </ButtonBase>
        );
      })}
    </Stack>
  );
}

function TransactionListRow({
  isLastItem,
  item,
}: {
  isLastItem: boolean;
  item: TransactionListItem;
}) {
  const content = (
    <TransactionRow item={item} showAccount showTime showRecorder />
  );
  const sx = {
    borderBottom: isLastItem ? "none" : userThemeCardBorder,
    color: "inherit",
    display: "block",
    outline: "none",
    textDecoration: "none",
    WebkitTapHighlightColor: "transparent",
    "&:focus-visible": {
      outline: "2px solid var(--user-theme-action-text)",
      outlineOffset: "-2px",
    },
  };

  if (item.canEdit === false) {
    return <Box sx={sx}>{content}</Box>;
  }

  return (
    <Box component={Link} href={transactionEditHref(item.id)} sx={sx}>
      {content}
    </Box>
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
  justifyContent: "space-between",
  minHeight: 64,
  px: 0.75,
  py: 0.75,
  width: "100%",
};

function getGroupSummaryText(group: TransactionDateGroup) {
  const expense = Number(group.summary.expense);
  const income = Number(group.summary.income);
  const currencySymbol = getCurrencySymbol(group.summary.currency);

  if (income > 0 && expense > 0) {
    return `收入 ${currencySymbol}${formatNumber(group.summary.income)} / 支出 ${currencySymbol}${formatNumber(
      group.summary.expense,
    )} / 合计 ${formatSignedAmount(group.summary.balance, currencySymbol)}`;
  }

  if (expense > 0) {
    return `支出 ${currencySymbol}${formatNumber(group.summary.expense)}`;
  }

  if (income > 0) {
    return `收入 ${currencySymbol}${formatNumber(group.summary.income)}`;
  }

  return `合计 ${formatSignedAmount(group.summary.balance, currencySymbol)}`;
}

function formatSignedAmount(amount: string, currencySymbol: string) {
  const value = Number(amount);

  if (!Number.isFinite(value))
    return `${currencySymbol}${formatNumber(amount)}`;
  if (value === 0) return `${currencySymbol}0`;

  const sign = value > 0 ? "+" : "-";
  return `${sign}${currencySymbol}${formatNumber(String(Math.abs(value)))}`;
}
