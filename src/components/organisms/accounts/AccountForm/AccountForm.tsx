import Button from "@mui/material/Button";
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";

import { FormActions } from "molecules/ui/FormActions";
import { AccountFields } from "organisms/accounts/AccountFields/AccountFields";

import type { ServerAction } from "types/actions";
import type { AccountHolderOption } from "types/accounts";
import { getCurrencySymbol } from "utils/currency";

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
        <AccountFields
          balanceLabel="初始金额"
          defaultCurrency={defaultCurrency}
          defaultType=""
          holderOptions={holderOptions}
          nameId="create-account-name"
          namePlaceholder="例如：钱包现金"
          renderBalanceField={(selectedCurrency) => (
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
          )}
          typePlaceholder="选择账户类型"
        />

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
