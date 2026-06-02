import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";

import { formatAmount, getAccountTypeLabel, type AccountType } from "./types";

type AccountCardProps = {
  name: string;
  type: AccountType;
  currency: string;
  initialBalance: number | string;
  currentBalance: number | string;
  actions?: ReactNode;
  footer?: ReactNode;
};

export function AccountCard({
  name,
  type,
  currency,
  initialBalance,
  currentBalance,
  actions,
  footer,
}: AccountCardProps) {
  return (
    <Paper
      elevation={0}
      sx={{ p: 3, border: "1px solid", borderColor: "divider" }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        sx={{ justifyContent: "space-between" }}
      >
        <Stack spacing={1}>
          <Stack
            direction="row"
            spacing={1}
            sx={{ alignItems: "center", flexWrap: "wrap" }}
          >
            <Typography component="h2" variant="h6" sx={{ fontWeight: 700 }}>
              {name}
            </Typography>
            <Chip label={getAccountTypeLabel(type)} size="small" />
          </Stack>

          <Typography color="text.secondary">
            当前余额：{formatAmount(currentBalance, currency)}
          </Typography>
          <Typography color="text.secondary" variant="body2">
            初始余额：{formatAmount(initialBalance, currency)}
          </Typography>
        </Stack>

        {actions}
      </Stack>

      {footer ? (
        <>
          <Divider sx={{ my: 3 }} />
          {footer}
        </>
      ) : null}
    </Paper>
  );
}
