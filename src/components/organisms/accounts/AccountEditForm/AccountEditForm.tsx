import InputAdornment from "@mui/material/InputAdornment";
import { getCurrencySymbol } from "utils/currency";
import CloseIcon from "@mui/icons-material/Close";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useEffect, useState, type ReactNode } from "react";
import { balanceAdjustmentText } from "config/balanceAdjustmentText";
import { isAccountBalanceText, isValidTargetBalance } from "internal/account";
import { formatNumber } from "utils/transactions";

import { PrimaryActionButton } from "atoms/ui/PrimaryActionButton/PrimaryActionButton";
import { ArchiveAccountButton } from "molecules/accounts/ArchiveAccountButton";
import { FormActions } from "molecules/ui/FormActions";
import { AccountFields } from "organisms/accounts/AccountFields/AccountFields";
import { designTokens } from "theme/theme";
import type { ServerAction } from "types/actions";
import type { AccountHolderOption, Account } from "types/accounts";

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
  const [targetBalance, setTargetBalance] = useState(
    String(account.current_balance),
  );
  const [adjustmentNote, setAdjustmentNote] = useState("");
  useEffect(() => {
    // 弹窗保持挂载期间账户余额被外部改变时，以最新余额重新校准基准，
    // 避免拿挂载时的旧快照和最新余额算出虚假差值。
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTargetBalance(String(account.current_balance));
    setAdjustmentNote("");
  }, [account.current_balance]);
  const validBalance =
    isAccountBalanceText(targetBalance) &&
    isValidTargetBalance(Number(targetBalance));
  const delta = validBalance
    ? (Math.round(Number(targetBalance) * 100) -
        Math.round(Number(account.current_balance) * 100)) /
      100
    : 0;
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
            <Stack spacing={1.5}>
              <TextField
                fullWidth
                name={delta !== 0 ? "targetBalance" : undefined}
                required
                value={targetBalance}
                onChange={(event) => setTargetBalance(event.target.value)}
                error={!validBalance}
                helperText={
                  !validBalance
                    ? balanceAdjustmentText.invalidBalance
                    : delta === 0
                      ? undefined
                      : `${delta > 0 ? balanceAdjustmentText.increase : balanceAdjustmentText.decrease} ${formatNumber(String(Math.abs(delta)), selectedCurrency)}`
                }
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        {getCurrencySymbol(selectedCurrency)}
                      </InputAdornment>
                    ),
                  },
                  htmlInput: {
                    "aria-label": balanceAdjustmentText.balanceLabel,
                    inputMode: "decimal",
                  },
                  formHelperText: {
                    sx: { color: delta > 0 ? "success.main" : "error.main" },
                  },
                }}
              />
              {delta !== 0 ? (
                <TextField
                  fullWidth
                  multiline
                  name="balanceAdjustmentNote"
                  value={adjustmentNote}
                  onChange={(event) => setAdjustmentNote(event.target.value)}
                  label={balanceAdjustmentText.noteLabel}
                  slotProps={{ htmlInput: { maxLength: 2000 } }}
                />
              ) : null}
            </Stack>
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
            disabled={!validBalance}
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
