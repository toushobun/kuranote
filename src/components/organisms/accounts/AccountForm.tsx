import Button from "@mui/material/Button";
import InputAdornment from "@mui/material/InputAdornment";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useState, type ReactNode } from "react";

import { AccountHolderCheckboxGroup } from "molecules/accounts/AccountHolderCheckboxGroup";
import { FormActions } from "molecules/ui/FormActions";

import type { ServerAction } from "types/actions";
import { accountTypeOptions, type AccountHolderOption } from "types/accounts";
import { getCurrencySymbol } from "utils/currency";

const commonCurrencyOptions = [
  { label: "CNY 人民币", value: "CNY" },
  { label: "JPY 日元", value: "JPY" },
  { label: "USD 美元", value: "USD" },
  { label: "EUR 欧元", value: "EUR" },
  { label: "GBP 英镑", value: "GBP" },
  { label: "KRW 韩元", value: "KRW" },
  { label: "THB 泰铢", value: "THB" },
] as const;

type AccountFormProps = {
  createAccountAction: ServerAction;
  defaultCurrency: string;
  holderOptions: AccountHolderOption[];
  illustrationSlot?: ReactNode;
  onCancel?: () => void;
  submitLabel?: string;
  title?: ReactNode;
};

export function AccountForm({
  createAccountAction,
  defaultCurrency,
  holderOptions,
  illustrationSlot = null,
  onCancel,
  submitLabel = "新增账户",
  title = "新增账户",
}: AccountFormProps) {
  const currencyOptions = commonCurrencyOptions.some(
    (option) => option.value === defaultCurrency,
  )
    ? commonCurrencyOptions
    : [
        { label: defaultCurrency, value: defaultCurrency },
        ...commonCurrencyOptions,
      ];

  const [selectedCurrency, setSelectedCurrency] = useState(defaultCurrency);

  return (
    <Stack spacing={2.5}>
      <Stack
        direction="row"
        spacing={2}
        sx={{ alignItems: "flex-start", justifyContent: "space-between" }}
      >
        <Typography component="h2" sx={{ fontSize: 24, fontWeight: 800 }}>
          {title}
        </Typography>
        {illustrationSlot}
      </Stack>

      <Stack component="form" action={createAccountAction} spacing={2}>
        <Stack spacing={0.8}>
          <Typography
            component="label"
            htmlFor="create-account-name"
            sx={fieldLabelSx}
          >
            账户名称
          </Typography>
          <TextField
            autoComplete="off"
            fullWidth
            id="create-account-name"
            name="name"
            placeholder="例如：钱包现金"
            required
            slotProps={{ htmlInput: { "aria-label": "账户名称" } }}
          />
        </Stack>

        <AccountFormRow label="账户类型">
          <TextField
            defaultValue=""
            fullWidth
            name="type"
            required
            select
            slotProps={{
              htmlInput: { "aria-label": "账户类型" },
              select: {
                displayEmpty: true,
                renderValue: (value: unknown) => {
                  const selectedOption = accountTypeOptions.find(
                    (option) => option.value === value,
                  );

                  return (
                    selectedOption?.label ?? (
                      <Typography
                        color="text.secondary"
                        component="span"
                        sx={{ fontWeight: 400 }}
                      >
                        选择账户类型
                      </Typography>
                    )
                  );
                },
              },
            }}
          >
            <MenuItem disabled value="">
              选择账户类型
            </MenuItem>
            {accountTypeOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </AccountFormRow>

        <AccountFormRow label="初始金额">
          <TextField
            defaultValue="0"
            fullWidth
            name="initialBalance"
            slotProps={{
              htmlInput: {
                "aria-label": "初始余额",
                inputMode: "decimal",
                "data-amount-input": "true",
                "data-amount-currency": selectedCurrency,
                sx: { color: "text.secondary", fontWeight: 400 },
              },
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    {getCurrencySymbol(selectedCurrency)}
                  </InputAdornment>
                ),
              },
            }}
            type="text"
          />
        </AccountFormRow>

        <AccountFormRow label="货币">
          <TextField
            defaultValue={defaultCurrency}
            fullWidth
            name="currency"
            onChange={(event) => setSelectedCurrency(event.target.value)}
            required
            select
            slotProps={{ htmlInput: { "aria-label": "货币" } }}
          >
            {currencyOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </AccountFormRow>

        <AccountHolderCheckboxGroup holderOptions={holderOptions} />

        <FormActions direction="row" sx={createActionBarSx}>
          {onCancel ? (
            <Button color="inherit" onClick={onCancel} type="button">
              取消
            </Button>
          ) : null}
          <Button
            fullWidth={Boolean(onCancel)}
            sx={submitButtonSx}
            type="submit"
            variant="contained"
          >
            {submitLabel}
          </Button>
        </FormActions>
      </Stack>
    </Stack>
  );
}

function AccountFormRow({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
      <Typography sx={rowLabelSx}>{label}</Typography>
      <Stack sx={{ flex: 1, minWidth: 0 }}>{children}</Stack>
    </Stack>
  );
}

const fieldLabelSx = {
  fontWeight: 700,
};

const rowLabelSx = {
  flex: "0 0 88px",
  fontWeight: 700,
};

const createActionBarSx = {
  alignItems: "center",
  display: "grid",
  gap: 1.5,
  gridTemplateColumns: "minmax(72px, 0.7fr) minmax(0, 2.3fr)",
  pt: 0.5,
};

const submitButtonSx = {
  background: "var(--user-theme-fab-bg)",
  color: "var(--user-theme-fab-text)",
  fontWeight: 800,
  minHeight: 48,
  "&:hover": {
    background: "var(--user-theme-fab-bg)",
    filter: "brightness(1.04)",
  },
};
