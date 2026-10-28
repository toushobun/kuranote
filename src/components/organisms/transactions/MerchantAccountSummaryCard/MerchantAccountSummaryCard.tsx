"use client";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import AccountBalanceWalletRoundedIcon from "@mui/icons-material/AccountBalanceWalletRounded";
import ListItemButton from "@mui/material/ListItemButton";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { MerchantAvatar } from "organisms/merchants/MerchantAvatar/MerchantAvatar";
import { flowMessages as m } from "config/transactionStepFlowMessages";
import type {
  TransactionAccountOption,
  TransactionMerchantOption,
} from "types/transactions";

type MerchantAccountSummaryCardProps = {
  merchant: TransactionMerchantOption;
  account?: TransactionAccountOption;
  onMerchantChange: () => void;
  onAccountChange: () => void;
};
export function MerchantAccountSummaryCard({
  merchant,
  account,
  onMerchantChange,
  onAccountChange,
}: MerchantAccountSummaryCardProps) {
  return (
    <Paper variant="outlined" sx={{ mt: 2, overflow: "hidden" }}>
      {[
        {
          step: 1,
          name: merchant.name,
          icon: (
            <MerchantAvatar
              size={28}
              toneKey={merchant.id}
              src={merchant.icon_url ?? undefined}
            />
          ),
        },
        ...(account
          ? [
              {
                step: 2,
                name: account.name,
                currency: account.currency,
                icon: (
                  <AccountBalanceWalletRoundedIcon
                    fontSize="small"
                    color="primary"
                  />
                ),
              },
            ]
          : []),
      ].map((row) => (
        <ListItemButton
          key={row.step}
          onClick={row.step === 1 ? onMerchantChange : onAccountChange}
          sx={{
            ...compactSx,
            ...(row.step === 2
              ? { borderTop: "1px solid", borderColor: "divider" }
              : {}),
          }}
        >
          {row.icon}
          <Typography noWrap sx={{ flex: 1 }}>
            {row.name}
          </Typography>
          {"currency" in row && (
            <Typography variant="body2" color="textSecondary">
              {row.currency}
            </Typography>
          )}
          <Typography color="primary" variant="body2">
            {m.change}
          </Typography>
          <ChevronRightRoundedIcon fontSize="small" />
        </ListItemButton>
      ))}
    </Paper>
  );
}
const compactSx = { minHeight: 44, gap: 1, py: 0.5, px: 1.5 };
