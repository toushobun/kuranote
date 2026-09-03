import AccountBalanceWalletRoundedIcon from "@mui/icons-material/AccountBalanceWalletRounded";
import CreditCardRoundedIcon from "@mui/icons-material/CreditCardRounded";
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import SmartphoneRoundedIcon from "@mui/icons-material/SmartphoneRounded";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { IconBadge } from "atoms/ui/IconBadge";
import {
  PrimaryActionButton,
  primaryActionButtonNoHoverBrightenSx,
} from "atoms/ui/PrimaryActionButton/PrimaryActionButton";
import { routePaths } from "config/paths";
import { SectionCard } from "molecules/ui/SectionCard";
import { userThemeCardBorder } from "theme/userThemeCardSx";
import type { DashboardAccountSummary } from "types/dashboard";
import { formatAmount } from "utils/accounts";

const accountIconMap = {
  bank: <AccountBalanceWalletRoundedIcon fontSize="small" />,
  cash: <PaymentsRoundedIcon fontSize="small" />,
  credit_card: <CreditCardRoundedIcon fontSize="small" />,
  e_money: <SmartphoneRoundedIcon fontSize="small" />,
} as const;

type DashboardMonthSummaryCardProps = {
  accounts: DashboardAccountSummary[];
  hasLedger?: boolean;
  monthLabel: string;
};

export function DashboardMonthSummaryCard({
  accounts,
  hasLedger = true,
  monthLabel,
}: DashboardMonthSummaryCardProps) {
  return (
    <SectionCard
      sx={{
        borderRadius: 1.25,
        overflow: "hidden",
        p: 1.5,
      }}
    >
      <Stack spacing={1.1}>
        <Stack
          direction="row"
          sx={{ alignItems: "center", justifyContent: "space-between" }}
        >
          <Typography
            sx={{ color: "text.primary", fontSize: 15, fontWeight: 900 }}
          >
            账户余额
          </Typography>
          <Typography sx={{ color: "text.secondary", fontSize: 12 }}>
            {hasLedger ? monthLabel : "等待创建账本"}
          </Typography>
        </Stack>

        {!hasLedger ? (
          <DashboardNoLedgerAccountState />
        ) : accounts.length > 0 ? (
          <Stack spacing={0}>
            {accounts.map((account) => (
              <Stack
                direction="row"
                key={account.id}
                spacing={1.1}
                sx={{
                  alignItems: "center",
                  borderTop: userThemeCardBorder,
                  minHeight: 40,
                  py: 0.75,
                }}
              >
                <IconBadge
                  size="sm"
                  sx={{
                    height: 28,
                    width: 28,
                  }}
                >
                  {getAccountIcon(account.type)}
                </IconBadge>
                <Typography
                  noWrap
                  sx={{
                    color: "text.primary",
                    flex: 1,
                    fontSize: 13,
                    fontWeight: 800,
                  }}
                >
                  {account.name}
                </Typography>
                <Typography
                  sx={{ color: "text.primary", fontSize: 13, fontWeight: 900 }}
                >
                  {formatAmount(account.balance, account.currency)}
                </Typography>
              </Stack>
            ))}
          </Stack>
        ) : (
          <Typography sx={{ color: "text.secondary", fontSize: 12 }}>
            还没有账户余额数据。
          </Typography>
        )}
      </Stack>
    </SectionCard>
  );
}

function DashboardNoLedgerAccountState() {
  return (
    <Stack
      direction={{ xs: "row", sm: "row" }}
      spacing={1.25}
      sx={{
        alignItems: "center",
        borderTop: userThemeCardBorder,
        pb: 0.2,
        pt: 1.2,
      }}
    >
      <Box
        aria-hidden="true"
        data-testid="dashboard-no-ledger-account-illustration-slot"
        sx={{
          backgroundImage: "var(--user-theme-dashboard-account-empty-image)",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundSize: "contain",
          flex: "0 0 auto",
          height: { xs: 82, sm: 90 },
          width: { xs: 84, sm: 96 },
        }}
      />

      <Stack spacing={0.8} sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          sx={{ color: "text.secondary", fontSize: 13, fontWeight: 700 }}
        >
          还没有账本，暂时无法显示账户余额
        </Typography>
        <PrimaryActionButton
          href={routePaths.ledgersNew}
          size="small"
          sx={{
            borderRadius: 1.5,
            boxShadow: "0 6px 18px var(--user-theme-fab-shadow)",
            fontWeight: 900,
            minHeight: 40,
            px: 1.6,
            py: 0.85,
            textDecoration: "none",
            ...primaryActionButtonNoHoverBrightenSx,
          }}
        >
          创建第一个账本
        </PrimaryActionButton>
      </Stack>
    </Stack>
  );
}

function getAccountIcon(type: string) {
  return (
    accountIconMap[type as keyof typeof accountIconMap] ?? accountIconMap.bank
  );
}
