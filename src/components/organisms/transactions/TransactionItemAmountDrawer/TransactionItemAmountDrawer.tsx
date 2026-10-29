"use client";
import { useState } from "react";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { MerchantEntrySuggestions } from "internal/transaction";
import { flowMessages as m } from "config/transactionStepFlowMessages";
import { TransactionAmountKeypad } from "organisms/transactions/TransactionAmountKeypad/TransactionAmountKeypad";
import { amountKeypadDrawerSx } from "organisms/transactions/TransactionAmountKeypadLauncher/TransactionAmountKeypadLauncher";
import { designTokens } from "theme/theme";
import { formatMoneyTextForCurrency } from "utils/transactionAmountInput";
import { formatUnsignedCurrencyAmount } from "utils/transactions";

type TransactionItemAmountDrawerProps = {
  open: boolean;
  title: string;
  categoryId?: string;
  currency: string;
  value: string;
  quickAmounts?: MerchantEntrySuggestions["quickAmounts"];
  onChange: (value: string) => void;
  onConfirm: (value: string) => void;
  onClose: () => void;
};
export function TransactionItemAmountDrawer({
  open,
  title,
  categoryId,
  currency,
  value,
  quickAmounts = [],
  onChange,
  onConfirm,
  onClose,
}: TransactionItemAmountDrawerProps) {
  const [quickRevision, setQuickRevision] = useState(0);
  function applyQuickAmount(amount: string) {
    setQuickRevision((value) => value + 1);
    onChange(amount);
  }
  const quick = quickAmounts.find(
    (item) => item.categoryId === categoryId && item.currency === currency,
  );
  // 填入与去重使用按币种格式化的金额，按钮显示再加货币符号与千位分隔符；格式化后与「上次」相同的常用金额不重复显示。
  const lastAmount =
    quick && formatMoneyTextForCurrency(quick.lastAmount, currency);
  const frequentAmounts = quick
    ? [
        ...new Set(
          quick.frequentAmounts.map((amount) =>
            formatMoneyTextForCurrency(amount, currency),
          ),
        ),
      ].filter((amount) => amount !== lastAmount)
    : [];
  const format = (amount: string) =>
    formatUnsignedCurrencyAmount(amount, currency);
  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      sx={amountKeypadDrawerSx}
      slotProps={{
        paper: {
          sx: {
            borderRadius: `${designTokens.radius.lg}px ${designTokens.radius.lg}px 0 0`,
            p: 1.5,
            pb: "max(12px, env(safe-area-inset-bottom))",
          },
        },
      }}
    >
      <Stack
        direction="row"
        sx={{ alignItems: "center", justifyContent: "space-between", px: 1 }}
      >
        <Typography variant="subtitle2">{m.amountTitle(title)}</Typography>
        <IconButton aria-label={m.closeAmount} onClick={onClose}>
          <CloseRoundedIcon />
        </IconButton>
      </Stack>
      {lastAmount && (
        <Box
          role="group"
          aria-label={m.quickAmounts}
          sx={{ display: "flex", gap: 1, overflowX: "auto", py: 1 }}
        >
          <Button
            variant="outlined"
            size="small"
            onClick={() => applyQuickAmount(lastAmount)}
            sx={{ flexShrink: 0 }}
          >
            {m.lastAmount(format(lastAmount))}
          </Button>
          {frequentAmounts.map((amount) => (
            <Button
              key={amount}
              variant="outlined"
              size="small"
              onClick={() => applyQuickAmount(amount)}
              sx={{ flexShrink: 0 }}
            >
              {format(amount)}
            </Button>
          ))}
        </Box>
      )}
      <TransactionAmountKeypad
        key={`${categoryId}:${currency}:${quickRevision}`}
        currency={currency}
        value={value}
        onChange={onChange}
        onConfirm={onConfirm}
        confirmLabel={m.confirmAmount}
      />
    </Drawer>
  );
}
