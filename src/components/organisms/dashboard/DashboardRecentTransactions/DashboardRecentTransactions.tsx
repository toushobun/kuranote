"use client";

import Box from "@mui/material/Box";
import MuiLink from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Link from "next/link";

import { routePaths } from "config/paths";
import { dashboardRecentTransactionCount } from "@/constants/dashboard";
import { TransactionRow } from "molecules/transactions/TransactionRow";
import { SectionCard } from "molecules/ui/SectionCard";
import { designTokens } from "theme/theme";
import type { DashboardRecentTransaction } from "types/dashboard";

type DashboardRecentTransactionsProps = {
  hasLedger?: boolean;
  transactions: DashboardRecentTransaction[];
};

export function DashboardRecentTransactions({
  hasLedger = true,
  transactions,
}: DashboardRecentTransactionsProps) {
  return (
    <Stack spacing={1}>
      <Stack
        direction="row"
        sx={{ alignItems: "center", justifyContent: "space-between" }}
      >
        <Typography
          sx={{ color: "text.primary", fontSize: 15, fontWeight: 900 }}
        >
          近期记录
        </Typography>
        {hasLedger ? (
          <MuiLink
            component={Link}
            href={routePaths.transactions}
            sx={{
              color: "text.secondary",
              fontSize: 12,
              fontWeight: 800,
              textDecoration: "none",
            }}
          >
            查看全部
          </MuiLink>
        ) : (
          <Typography sx={{ color: "text.secondary", fontSize: 12 }}>
            需先创建账本
          </Typography>
        )}
      </Stack>

      <SectionCard
        sx={{
          borderRadius: 1.25,
          overflow: "hidden",
          px: 1.2,
          py: 0,
        }}
      >
        {!hasLedger ? (
          <DashboardNoLedgerRecentState />
        ) : transactions.length > 0 ? (
          <Stack spacing={0}>
            {transactions
              .slice(0, dashboardRecentTransactionCount)
              .map((item) => (
                <TransactionRow
                  item={item}
                  key={item.id}
                  showAccount
                  showTime
                />
              ))}
          </Stack>
        ) : (
          <Typography
            color="text.secondary"
            sx={{ py: 4, textAlign: "center" }}
            variant="body2"
          >
            还没有记账记录。
          </Typography>
        )}
      </SectionCard>
    </Stack>
  );
}

function DashboardNoLedgerRecentState() {
  return (
    <Stack spacing={1.2} sx={{ alignItems: "center", px: 1, py: 3.2 }}>
      <Box
        aria-hidden="true"
        data-testid="dashboard-no-ledger-recent-illustration-slot"
        sx={{
          backgroundImage: "var(--user-theme-dashboard-recent-empty-image)",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundSize: "contain",
          height: 78,
          width: 132,
        }}
      />
      <Typography
        sx={{ color: "text.secondary", fontSize: 13, textAlign: "center" }}
      >
        创建账本后，你的近期记录会显示在这里
      </Typography>
      <Stack spacing={0.8} sx={{ width: "72%" }}>
        <DashboardRecentPlaceholderLine />
        <DashboardRecentPlaceholderLine />
      </Stack>
    </Stack>
  );
}

function DashboardRecentPlaceholderLine() {
  return (
    <Stack direction="row" spacing={0.8} sx={{ alignItems: "center" }}>
      <Box
        aria-hidden="true"
        sx={{
          backgroundColor: "var(--user-theme-segment-bg)",
          borderRadius: "50%",
          height: 10,
          width: 10,
        }}
      />
      <Box
        aria-hidden="true"
        sx={{
          backgroundColor: "var(--user-theme-segment-bg)",
          borderRadius: `${designTokens.radius.full}px`,
          flex: 1,
          height: 8,
        }}
      />
    </Stack>
  );
}
