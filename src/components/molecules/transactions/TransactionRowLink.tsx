"use client";

import Box from "@mui/material/Box";
import Link from "next/link";

import { TransactionRow } from "molecules/transactions/TransactionRow";
import { userThemeCardBorder } from "theme/userThemeCardSx";
import type { TransactionRowItem } from "types/transactions";

type TransactionRowLinkProps = {
  href: string;
  item: TransactionRowItem;
  sharedPaymentSubject?: string;
  showDivider?: boolean;
};

/**
 * 列表中进入记录的行。所有行都可点击（#928）：有编辑权限进编辑，无权限由记录页显示只读详情。
 */
export function TransactionRowLink({
  href,
  item,
  sharedPaymentSubject,
  showDivider = false,
}: TransactionRowLinkProps) {
  return (
    <Box
      component={Link}
      href={href}
      sx={[
        transactionRowLinkSx,
        showDivider && { borderBottom: userThemeCardBorder },
      ]}
    >
      <TransactionRow
        item={item}
        sharedPaymentSubject={sharedPaymentSubject}
        showAccount
        showTime
      />
    </Box>
  );
}

const transactionRowLinkSx = {
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
