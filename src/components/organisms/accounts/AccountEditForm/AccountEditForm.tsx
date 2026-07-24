import CloseIcon from "@mui/icons-material/Close";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useState, type ReactNode } from "react";

import { AccountHolderCheckboxGroup } from "molecules/accounts/AccountHolderCheckboxGroup";
import { ArchiveAccountButton } from "molecules/accounts/ArchiveAccountButton";
import { FormActions } from "molecules/ui/FormActions";
import type { ServerAction } from "types/actions";
import {
  accountTypeOptions,
  type AccountHolderOption,
  type AccountRow,
} from "types/accounts";
import { formatAmount } from "utils/accounts";

export function getAccountEditFormId(accountId: string) {
  return `edit-account-form-${accountId}`;
}

export function getAccountArchiveFormId(accountId: string) {
  return `archive-account-form-${accountId}`;
}

const currencyOptions = [
  { label: "CNY 人民币", value: "CNY" },
  { label: "JPY 日元", value: "JPY" },
  { label: "USD 美元", value: "USD" },
  { label: "EUR 欧元", value: "EUR" },
  { label: "GBP 英镑", value: "GBP" },
  { label: "KRW 韩元", value: "KRW" },
  { label: "THB 泰铢", value: "THB" },
] as const;

type AccountEditFormProps = {
  account: AccountRow;
  archiveAccountAction?: ServerAction;
  holderOptions: AccountHolderOption[];
  illustrationSlot?: ReactNode;
  onCancel?: () => void;
  onDirty?: () => void;
  onSubmit?: () => void;
  updateAccountAction: ServerAction;
};

export function AccountEditForm({
  account,
  archiveAccountAction,
  holderOptions,
  illustrationSlot = null,
  onCancel,
  onDirty,
  onSubmit,
  updateAccountAction,
}: AccountEditFormProps) {
  const formId = getAccountEditFormId(account.id);
  const archiveFormId = getAccountArchiveFormId(account.id);
  const selectableHolderUserIds = new Set(
    holderOptions.map((option) => option.user_id),
  );
  const preservedHolderOptions = account.holders
    .filter((holder) => !selectableHolderUserIds.has(holder.user_id))
    .map((holder) => ({
      user_id: holder.user_id,
      display_name: holder.display_name,
      email: holder.email,
    }));

  const defaultCurrency = account.currency;

  const [selectedCurrency, setSelectedCurrency] = useState(defaultCurrency);

  return (
    <Stack spacing={2.5}>
      <Stack
        direction="row"
        spacing={2}
        sx={{ alignItems: "flex-start", justifyContent: "space-between" }}
      >
        <IconButton aria-label="关闭" onClick={onCancel} sx={closeButtonSx}>
          <CloseIcon />
        </IconButton>
        <Typography
          component="h2"
          sx={{ flex: 1, fontSize: 24, fontWeight: 800 }}
        >
          编辑账户
        </Typography>
        {illustrationSlot}
      </Stack>

      <Stack
        component="form"
        action={updateAccountAction}
        id={formId}
        onChangeCapture={onDirty}
        onSubmit={() => onSubmit?.()}
        spacing={2}
      >
        <input name="accountId" type="hidden" value={account.id} />

        <Stack spacing={0.8}>
          <Typography
            component="label"
            htmlFor="edit-account-name"
            sx={fieldLabelSx}
          >
            账户名称
          </Typography>
          <TextField
            autoComplete="off"
            defaultValue={account.name}
            fullWidth
            id="edit-account-name"
            name="name"
            required
            slotProps={{ htmlInput: { "aria-label": "账户名称" } }}
          />
        </Stack>

        <EditFormRow label="账户类型">
          <TextField
            defaultValue={account.type}
            fullWidth
            name="type"
            required
            select
            slotProps={{ htmlInput: { "aria-label": "账户类型" } }}
          >
            {accountTypeOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </EditFormRow>

        <EditFormRow label="当前余额">
          <TextField
            disabled
            fullWidth
            value={formatAmount(account.current_balance, selectedCurrency)}
            slotProps={{ htmlInput: { "aria-label": "当前余额" } }}
          />
        </EditFormRow>

        <EditFormRow label="货币">
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
            {!currencyOptions.some((o) => o.value === account.currency) && (
              <MenuItem value={account.currency}>{account.currency}</MenuItem>
            )}
          </TextField>
        </EditFormRow>

        <AccountHolderCheckboxGroup
          holderOptions={holderOptions}
          preservedHolderOptions={preservedHolderOptions}
          selectedUserIds={account.holders.map((holder) => holder.user_id)}
        />

        <FormActions direction="row" sx={actionBarSx}>
          {archiveAccountAction ? (
            <ArchiveAccountButton formId={archiveFormId} label="删除" />
          ) : null}
          <Button
            form={formId}
            fullWidth={Boolean(archiveAccountAction)}
            type="submit"
            variant="contained"
            sx={saveButtonSx}
          >
            保存修改
          </Button>
        </FormActions>
      </Stack>

      {archiveAccountAction ? (
        <form action={archiveAccountAction} id={archiveFormId}>
          <input name="accountId" type="hidden" value={account.id} />
        </form>
      ) : null}
    </Stack>
  );
}

function EditFormRow({
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

const closeButtonSx = {
  color: "text.secondary",
  ml: -1,
  mt: -1,
};

const fieldLabelSx = {
  fontWeight: 700,
};

const rowLabelSx = {
  flex: "0 0 88px",
  fontWeight: 700,
};

const actionBarSx = {
  alignItems: "center",
  display: "grid",
  gap: 1.5,
  gridTemplateColumns: "minmax(72px, 0.7fr) minmax(0, 2.3fr)",
  pt: 0.5,
};

const saveButtonSx = {
  background: "var(--user-theme-fab-bg)",
  color: "var(--user-theme-fab-text)",
  fontWeight: 800,
  minHeight: 48,
  minWidth: 0,
  width: "100%",
  "&:hover": {
    background: "var(--user-theme-fab-bg)",
    filter: "brightness(1.04)",
  },
};
