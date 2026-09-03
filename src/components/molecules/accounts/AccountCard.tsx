import AccountBalanceOutlinedIcon from "@mui/icons-material/AccountBalanceOutlined";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import CreditCardOutlinedIcon from "@mui/icons-material/CreditCardOutlined";
import MoreHorizRoundedIcon from "@mui/icons-material/MoreHorizRounded";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";

import { SoftCard } from "atoms/ui/SoftCard";
import { designTokens } from "theme/theme";
import { themeColorTokens } from "theme/themeColorTokens";

import type { AccountHolder, AccountType } from "types/accounts";
import {
  formatAmount,
  getAccountHolderLabel,
  getAccountTypeLabel,
} from "utils/accounts";

type AccountCardProps = {
  name: string;
  type: AccountType;
  currency: string;
  currentBalance: number | string;
  holders?: AccountHolder[];
  actions?: ReactNode;
  footer?: ReactNode;
  onClick?: () => void;
};

export function AccountCard({
  name,
  type,
  currency,
  currentBalance,
  holders = [],
  actions,
  footer,
  onClick,
}: AccountCardProps) {
  const card = (
    <SoftCard
      sx={{
        borderRadius: `${designTokens.radius.md}px`,
        p: { xs: 1.5, sm: 1.75 },
      }}
    >
      <Stack spacing={1.25}>
        <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
          <Box sx={accountIconSx}>
            <AccountTypeIcon type={type} />
          </Box>

          <Stack spacing={0.65} sx={{ flex: 1, minWidth: 0 }}>
            <Stack
              direction="row"
              spacing={0.75}
              sx={{ alignItems: "center", flexWrap: "wrap" }}
            >
              <Typography
                component="h2"
                sx={{ fontSize: { xs: 16, sm: 17 }, fontWeight: 800 }}
              >
                {name}
              </Typography>
              <Chip
                label={getAccountTypeLabel(type)}
                size="small"
                sx={accountTypeChipSx}
              />
            </Stack>

            <Stack
              direction="row"
              spacing={0.6}
              sx={{ alignItems: "center", flexWrap: "wrap" }}
            >
              {holders.length > 0 ? (
                holders.map((holder) => {
                  const colorToken = themeColorTokens[holder.display_color];

                  return (
                    <Chip
                      key={holder.id}
                      label={getAccountHolderLabel(holder)}
                      size="small"
                      sx={{
                        bgcolor: colorToken.chipBackground,
                        borderColor: colorToken.chipBorder,
                        color: colorToken.chipText,
                        fontWeight: 600,
                        height: 24,
                      }}
                      variant="outlined"
                    />
                  );
                })
              ) : (
                <Typography color="text.secondary" variant="body2">
                  未设置持有人
                </Typography>
              )}
            </Stack>
          </Stack>

          <Stack spacing={0.6} sx={{ alignItems: "flex-end", flexShrink: 0 }}>
            <Typography sx={{ fontSize: { xs: 16, sm: 17 }, fontWeight: 900 }}>
              {formatAmount(currentBalance, currency)}
            </Typography>
            <Chip
              color="success"
              label="使用中"
              size="small"
              sx={accountStatusChipSx}
            />
          </Stack>
        </Stack>

        {actions}
      </Stack>

      {footer ? (
        <>
          <Divider sx={{ my: 3 }} />
          {footer}
        </>
      ) : null}
    </SoftCard>
  );

  if (!onClick) {
    return card;
  }

  return (
    <ButtonBase component="div" onClick={onClick} sx={cardButtonSx}>
      {card}
    </ButtonBase>
  );
}

function AccountTypeIcon({ type }: { type: AccountType }) {
  const iconProps = { fontSize: "small" as const };

  switch (type) {
    case "cash":
      return <PaymentsOutlinedIcon {...iconProps} />;
    case "bank":
      return <AccountBalanceOutlinedIcon {...iconProps} />;
    case "credit_card":
      return <CreditCardOutlinedIcon {...iconProps} />;
    case "e_money":
      return <AccountBalanceWalletOutlinedIcon {...iconProps} />;
    default:
      return <MoreHorizRoundedIcon {...iconProps} />;
  }
}

const accountIconSx = {
  alignItems: "center",
  bgcolor: "var(--user-theme-field-card-selected-bg)",
  borderRadius: 2,
  color: "var(--user-theme-action-text)",
  display: "flex",
  flex: "0 0 auto",
  height: 38,
  justifyContent: "center",
  width: 38,
};

const accountTypeChipSx = {
  bgcolor: "action.hover",
  height: 24,
};

const accountStatusChipSx = {
  bgcolor: "var(--user-theme-business-completed-bg)",
  color: "var(--user-theme-business-completed-text)",
  height: 24,
  fontWeight: 700,
};

const cardButtonSx = {
  borderRadius: "inherit",
  color: "inherit",
  display: "block",
  textAlign: "left",
  width: "100%",
};
