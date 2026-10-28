"use client";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import AccountBalanceWalletRoundedIcon from "@mui/icons-material/AccountBalanceWalletRounded";
import Box from "@mui/material/Box";
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
  paymentAccountCount?: number;
  onMerchantChange: () => void;
  onAccountChange: () => void;
};
export function MerchantAccountSummaryCard({
  merchant,
  account,
  paymentAccountCount = 1,
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
                name:
                  paymentAccountCount > 1
                    ? m.multipleAccounts(account.name, paymentAccountCount)
                    : account.name,
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
      ].map((row) => {
        const editable = row.step === 1 || paymentAccountCount <= 1;
        const content = (
          <>
            {row.icon}
            <Typography noWrap sx={{ flex: 1 }}>
              {row.name}
            </Typography>
            {"currency" in row && (
              <Typography variant="body2" color="textSecondary">
                {row.currency}
              </Typography>
            )}
            {editable && (
              <>
                <Typography color="primary" variant="body2">
                  {m.change}
                </Typography>
                <ChevronRightRoundedIcon fontSize="small" />
              </>
            )}
          </>
        );
        return (
          <Box
            key={row.step}
            sx={
              row.step === 2
                ? { borderTop: "1px solid", borderColor: "divider" }
                : undefined
            }
          >
            {editable ? (
              <ListItemButton
                onClick={row.step === 1 ? onMerchantChange : onAccountChange}
                sx={compactSx}
              >
                {content}
              </ListItemButton>
            ) : (
              <Box sx={{ ...compactSx, display: "flex", alignItems: "center" }}>
                {content}
              </Box>
            )}
          </Box>
        );
      })}
    </Paper>
  );
}
const compactSx = { minHeight: 44, gap: 1, py: 0.5, px: 1.5 };
