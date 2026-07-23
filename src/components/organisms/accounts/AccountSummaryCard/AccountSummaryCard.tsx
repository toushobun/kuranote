"use client";

import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import WalletOutlinedIcon from "@mui/icons-material/WalletOutlined";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useState, type ReactNode } from "react";

import { SoftCard } from "atoms/ui/SoftCard";
import type { AccountRow } from "types/accounts";
import { formatAmount } from "utils/accounts";

type AccountSummaryCardProps = {
  accounts: AccountRow[];
  baseCurrency: string;
};

export function AccountSummaryCard({
  accounts,
  baseCurrency,
}: AccountSummaryCardProps) {
  const [isBalanceHidden, setIsBalanceHidden] = useState(false);
  const baseCurrencyAccounts = accounts.filter(
    (account) => account.currency === baseCurrency,
  );
  const hasForeignCurrencyAccounts =
    baseCurrencyAccounts.length < accounts.length;
  const totalBalance = baseCurrencyAccounts.reduce((total, account) => {
    const currentBalance = Number(account.current_balance);

    if (!Number.isFinite(currentBalance)) {
      return total;
    }

    return total + currentBalance;
  }, 0);
  const holderCount = new Set(
    accounts.flatMap((account) =>
      account.holders.map((holder) => holder.user_id),
    ),
  ).size;
  const balanceText = isBalanceHidden
    ? "******"
    : formatAmount(totalBalance, baseCurrency);
  const balanceParts = isBalanceHidden ? null : splitAmountPrefix(balanceText);

  return (
    <SoftCard sx={{ borderRadius: 1, p: { xs: 1.8, sm: 2 } }}>
      <Stack spacing={1.5}>
        <Stack spacing={0.6}>
          <Typography color="text.secondary" variant="body2">
            账户总余额
          </Typography>
          <Stack direction="row" spacing={0.6} sx={{ alignItems: "center" }}>
            <Typography
              aria-label={balanceText}
              component="p"
              sx={{
                alignItems: "baseline",
                color: "var(--user-theme-action-text)",
                columnGap: 0.75,
                display: "flex",
                fontSize: { xs: 27, sm: 30 },
                fontWeight: 700,
                lineHeight: 1.1,
              }}
            >
              {balanceParts ? (
                <>
                  <Box component="span" sx={balanceCurrencySx}>
                    {balanceParts.prefix}
                  </Box>
                  <Box component="span">{balanceParts.value}</Box>
                </>
              ) : (
                balanceText
              )}
            </Typography>
            <IconButton
              aria-label={isBalanceHidden ? "显示余额" : "隐藏余额"}
              onClick={() => setIsBalanceHidden((prev) => !prev)}
              size="small"
              sx={balanceVisibilityButtonSx}
            >
              {isBalanceHidden ? (
                <VisibilityOutlinedIcon fontSize="small" />
              ) : (
                <VisibilityOffOutlinedIcon fontSize="small" />
              )}
            </IconButton>
          </Stack>
          {hasForeignCurrencyAccounts ? (
            <Typography color="text.secondary" variant="caption">
              外币账户未计入总余额，暂不支持汇率换算。
            </Typography>
          ) : null}
        </Stack>

        <Divider />

        <Stack
          direction="row"
          divider={<Divider flexItem orientation="vertical" />}
          spacing={1.5}
          sx={{ justifyContent: "space-between" }}
        >
          <SummaryMetric
            icon={<WalletOutlinedIcon fontSize="small" />}
            label="账户数量"
            value={`${accounts.length} 个`}
          />
          <SummaryMetric
            icon={<GroupsOutlinedIcon fontSize="small" />}
            label="持有人"
            value={`${holderCount} 位`}
          />
        </Stack>
      </Stack>
    </SoftCard>
  );
}

function splitAmountPrefix(text: string) {
  const match = text.match(/^([^\d]*)(\d.*)$/u);

  if (!match) return null;

  return {
    prefix: match[1].trim(),
    value: match[2],
  };
}

function SummaryMetric({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Stack direction="row" spacing={1.2} sx={{ alignItems: "center", flex: 1 }}>
      <Stack
        sx={{
          alignItems: "center",
          bgcolor: "var(--user-theme-field-card-selected-bg)",
          borderRadius: 2,
          color: "var(--user-theme-action-text)",
          height: 38,
          justifyContent: "center",
          width: 38,
        }}
      >
        {icon}
      </Stack>
      <Stack spacing={0.2}>
        <Typography color="text.secondary" variant="caption">
          {label}
        </Typography>
        <Typography sx={{ fontWeight: 900 }}>{value}</Typography>
      </Stack>
    </Stack>
  );
}

const balanceVisibilityButtonSx = {
  color: "text.secondary",
  flexShrink: 0,
  transform: "translateY(5px)",
  "&:hover": {
    bgcolor: "var(--user-theme-field-card-selected-bg)",
  },
};

const balanceCurrencySx = {
  fontSize: "0.78em",
  fontWeight: 500,
};
