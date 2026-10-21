"use client";

import AccountBalanceWalletRoundedIcon from "@mui/icons-material/AccountBalanceWalletRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import KeyboardArrowRightRoundedIcon from "@mui/icons-material/KeyboardArrowRightRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { transactionSetupHintMessages } from "config/transactionMessages";
import { outlinedInputTokenSx } from "molecules/ui/outlinedInputTokenSx";
import { designTokens } from "theme/theme";
import { userThemeCardBorderSx } from "theme/userThemeCardSx";
import type { TransactionAccountOption } from "types/transactions";
import { getCurrencySymbol } from "utils/currency";
import {
  transactionAccountSectionMessages,
  transactionPaymentFieldsMessages,
} from "utils/transactionMessages";
import { formatUnsignedCurrencyAmount } from "utils/transactions";

import {
  TransactionSelectionValue,
  transactionSelectionSelectSx,
} from "../TransactionSelectionValue/TransactionSelectionValue";
import {
  canAddPaymentRow,
  isPaymentAccountSelectable,
  type TransactionPaymentReconciliation,
  type TransactionPaymentRow,
} from "./useTransactionPaymentFields";

type TransactionPaymentFieldsProps = {
  accountOptions: TransactionAccountOption[];
  fieldError?: string;
  onAccountChange: (key: number, accountId: string) => void;
  onAddPayment: () => void;
  onAmountChange: (key: number, amount: string) => void;
  onRemovePayment: (key: number) => void;
  payments: TransactionPaymentRow[];
  reconciliation: TransactionPaymentReconciliation;
  /** 没有账户且未显示添加账户提示卡片时，在字段下方提示先新增账户。 */
  showEmptyAccountHelper: boolean;
};

/**
 * 普通记账的付款账户。单账户时与原来的账户选择一致（提交 `accountId`）；
 * 展开为多账户后每行是账户、金额、删除（提交 `paymentAccountId[]` /
 * `paymentAmount[]`），下方是「付款合计 / 明细合计」对账条。
 */
export function TransactionPaymentFields({
  accountOptions,
  fieldError,
  onAccountChange,
  onAddPayment,
  onAmountChange,
  onRemovePayment,
  payments,
  reconciliation,
  showEmptyAccountHelper,
}: TransactionPaymentFieldsProps) {
  const hasNoAccount = accountOptions.length === 0;
  const isMultiAccount = payments.length > 1;
  const primaryPayment = payments[0];
  const primaryAccount = accountOptions.find(
    (account) => account.id === primaryPayment?.accountId,
  );
  const primaryCurrency = primaryAccount?.currency;
  // 入口只取决于可选账户，不受字段错误等其他状态影响（#930）。
  const addPaymentButton = canAddPaymentRow({
    accountOptions,
    payments,
    primaryCurrency,
  }) ? (
    <Button
      onClick={onAddPayment}
      size="small"
      startIcon={<AddRoundedIcon fontSize="small" />}
      type="button"
      variant="text"
      sx={addPaymentButtonSx}
    >
      {transactionPaymentFieldsMessages.addPayment}
    </Button>
  ) : null;

  if (!isMultiAccount || !primaryPayment) {
    return (
      <Stack spacing={0.5}>
        <TextField
          disabled={hasNoAccount}
          error={!!fieldError}
          fullWidth
          helperText={
            fieldError ??
            (showEmptyAccountHelper
              ? transactionAccountSectionMessages.emptyAccountHelper
              : undefined)
          }
          label={transactionAccountSectionMessages.accountLabel}
          name="accountId"
          onChange={(event) =>
            primaryPayment &&
            onAccountChange(primaryPayment.key, event.target.value)
          }
          select
          slotProps={{
            select: {
              displayEmpty: true,
              IconComponent: KeyboardArrowRightRoundedIcon,
              renderValue: () => (
                <TransactionSelectionValue
                  icon={<AccountBalanceWalletRoundedIcon fontSize="small" />}
                  muted={hasNoAccount}
                  text={
                    primaryAccount
                      ? formatAccountOptionLabel(primaryAccount)
                      : hasNoAccount
                        ? transactionSetupHintMessages.emptyAccount
                        : transactionAccountSectionMessages.accountPlaceholder
                  }
                  tone="account"
                />
              ),
            },
          }}
          value={primaryPayment?.accountId ?? ""}
          sx={transactionSelectionSelectSx}
        >
          <MenuItem disabled value="">
            {transactionAccountSectionMessages.accountRequiredOption}
          </MenuItem>
          {accountOptions.map((account) => (
            <MenuItem key={account.id} value={account.id}>
              {formatAccountOptionLabel(account)}
            </MenuItem>
          ))}
        </TextField>
        {addPaymentButton}
      </Stack>
    );
  }

  const currencySymbol = getCurrencySymbol(primaryCurrency);

  return (
    <Stack spacing={1}>
      {payments.map((payment, index) => {
        const rowNumber = index + 1;
        const account = accountOptions.find(
          (option) => option.id === payment.accountId,
        );
        return (
          <Box key={payment.key} sx={paymentRowSx}>
            <TextField
              fullWidth
              label={transactionPaymentFieldsMessages.paymentAccountLabel(
                rowNumber,
              )}
              name="paymentAccountId"
              onChange={(event) =>
                onAccountChange(payment.key, event.target.value)
              }
              select
              slotProps={{
                select: {
                  displayEmpty: true,
                  IconComponent: KeyboardArrowRightRoundedIcon,
                  renderValue: () => (
                    <TransactionSelectionValue
                      icon={
                        <AccountBalanceWalletRoundedIcon fontSize="small" />
                      }
                      text={
                        account
                          ? formatAccountOptionLabel(account)
                          : transactionAccountSectionMessages.accountPlaceholder
                      }
                      tone="account"
                    />
                  ),
                },
              }}
              value={payment.accountId}
              sx={transactionSelectionSelectSx}
            >
              <MenuItem disabled value="">
                {transactionAccountSectionMessages.accountRequiredOption}
              </MenuItem>
              {accountOptions.map((option) => (
                <MenuItem
                  disabled={
                    !isPaymentAccountSelectable({
                      account: option,
                      payments,
                      primaryCurrency,
                      rowKey: payment.key,
                    })
                  }
                  key={option.id}
                  value={option.id}
                >
                  {formatAccountOptionLabel(option)}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              hiddenLabel
              name="paymentAmount"
              onChange={(event) =>
                onAmountChange(payment.key, event.target.value)
              }
              slotProps={{
                htmlInput: {
                  "aria-label":
                    transactionPaymentFieldsMessages.paymentAmountLabel(
                      rowNumber,
                    ),
                  "data-amount-currency": primaryCurrency ?? "",
                  "data-amount-input": "true",
                  inputMode: "decimal" as const,
                },
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      {currencySymbol}
                    </InputAdornment>
                  ),
                },
              }}
              type="text"
              value={payment.amount}
              sx={paymentAmountFieldSx}
            />
            <IconButton
              aria-label={transactionPaymentFieldsMessages.removePayment(
                rowNumber,
              )}
              onClick={() => onRemovePayment(payment.key)}
              sx={removePaymentButtonSx}
            >
              <DeleteOutlineRoundedIcon fontSize="small" />
            </IconButton>
          </Box>
        );
      })}
      {addPaymentButton}
      <Box
        aria-live="polite"
        role="status"
        sx={[
          reconciliationBarSx,
          !reconciliation.isBalanced && reconciliationBarErrorSx,
        ]}
      >
        <Typography variant="body2" sx={{ fontWeight: 700 }}>
          {transactionPaymentFieldsMessages.reconciliation(
            formatPaymentAmount(reconciliation.paymentTotal, primaryCurrency),
            formatPaymentAmount(reconciliation.itemTotal, primaryCurrency),
          )}
        </Typography>
        {reconciliation.isBalanced ? null : (
          <Typography color="error" variant="body2" sx={{ fontWeight: 800 }}>
            {transactionPaymentFieldsMessages.difference(
              formatPaymentAmount(reconciliation.difference, primaryCurrency),
            )}
          </Typography>
        )}
      </Box>
      {fieldError ? (
        <Typography color="error" variant="body2" sx={{ px: 0.25 }}>
          {fieldError}
        </Typography>
      ) : null}
    </Stack>
  );
}

function formatAccountOptionLabel(account: TransactionAccountOption) {
  return `${account.name}（${account.currency}）`;
}

function formatPaymentAmount(amount: string, currency: string | undefined) {
  return formatUnsignedCurrencyAmount(amount, currency ?? "");
}

const paymentRowSx = {
  alignItems: "center",
  display: "grid",
  gap: 1,
  gridTemplateColumns: "minmax(0, 1fr) 112px 40px",
};

const paymentAmountFieldSx = {
  ...outlinedInputTokenSx,
  "& .MuiOutlinedInput-root": {
    ...outlinedInputTokenSx["& .MuiOutlinedInput-root"],
    borderRadius: `${designTokens.radius.md}px`,
    minHeight: 50,
  },
  "& .MuiOutlinedInput-input": {
    fontWeight: 800,
    textAlign: "right",
  },
};

const removePaymentButtonSx = {
  color: "text.secondary",
  height: 40,
  width: 40,
};

const addPaymentButtonSx = {
  alignSelf: "flex-start",
  color: "text.secondary",
  fontWeight: 700,
  px: 0.75,
};

const reconciliationBarSx = {
  alignItems: "center",
  bgcolor: "var(--user-theme-card-bg)",
  ...userThemeCardBorderSx,
  borderRadius: `${designTokens.radius.md}px`,
  display: "flex",
  flexWrap: "wrap",
  gap: 1,
  justifyContent: "space-between",
  px: 1.5,
  py: 1,
};

const reconciliationBarErrorSx = {
  borderColor: "error.main",
};
