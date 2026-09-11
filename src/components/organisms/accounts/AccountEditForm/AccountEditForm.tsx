import CloseIcon from "@mui/icons-material/Close";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";

import { PrimaryActionButton } from "atoms/ui/PrimaryActionButton/PrimaryActionButton";
import { ArchiveAccountButton } from "molecules/accounts/ArchiveAccountButton";
import { FormActions } from "molecules/ui/FormActions";
import { AccountFields } from "organisms/accounts/AccountFields/AccountFields";
import { designTokens } from "theme/theme";
import type { ServerAction } from "types/actions";
import type { AccountHolderOption, Account } from "types/accounts";
import { formatAmount } from "utils/accounts";

export function getAccountEditFormId(accountId: string) {
  return `edit-account-form-${accountId}`;
}

export function getAccountArchiveFormId(accountId: string) {
  return `archive-account-form-${accountId}`;
}

type AccountEditFormProps = {
  account: Account;
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

        <AccountFields
          balanceLabel="当前余额"
          defaultCurrency={account.currency}
          defaultName={account.name}
          defaultType={account.type}
          holderOptions={holderOptions}
          nameId="edit-account-name"
          preservedHolderOptions={preservedHolderOptions}
          renderBalanceField={(selectedCurrency) => (
            <TextField
              disabled
              fullWidth
              value={formatAmount(account.current_balance, selectedCurrency)}
              slotProps={{ htmlInput: { "aria-label": "当前余额" } }}
            />
          )}
          selectedHolderUserIds={account.holders.map(
            (holder) => holder.user_id,
          )}
        />

        <FormActions direction="row" sx={actionBarSx}>
          {archiveAccountAction ? (
            <ArchiveAccountButton formId={archiveFormId} label="删除" />
          ) : null}
          <PrimaryActionButton
            form={formId}
            fullWidth={Boolean(archiveAccountAction)}
            type="submit"
            sx={saveButtonSx}
          >
            保存修改
          </PrimaryActionButton>
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

const closeButtonSx = {
  color: "text.secondary",
  ml: -1,
  mt: -1,
};

const actionBarSx = {
  alignItems: "center",
  display: "grid",
  gap: 1.5,
  gridTemplateColumns: "minmax(72px, 0.7fr) minmax(0, 2.3fr)",
  pt: 0.5,
};

const saveButtonSx = {
  borderRadius: `${designTokens.radius.md}px`,
  fontWeight: 800,
  minHeight: 48,
  minWidth: 0,
  width: "100%",
};
