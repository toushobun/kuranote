"use client";

import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useId, useState } from "react";

import { PrimaryActionButton } from "atoms/ui/PrimaryActionButton/PrimaryActionButton";
import { ledgerSetupAccountsMessages } from "config/ledgerSetupMessages";
import { AccountFormDialogShell } from "organisms/accounts/AccountFormDialogShell/AccountFormDialogShell";
import { useBackLayerLevel } from "molecules/ui/UnsavedChangesDialog/BackLayerScope";
import { UnsavedChangesDialog } from "molecules/ui/UnsavedChangesDialog/UnsavedChangesDialog";
import { useUnsavedChangesGuard } from "molecules/ui/UnsavedChangesDialog/useUnsavedChangesGuard";
import { designTokens } from "theme/theme";
import { getAccountTypeLabel } from "utils/accounts";

import {
  useLedgerSetupAccountAddForm,
  type UseLedgerSetupAccountAddFormOptions,
} from "./useLedgerSetupAccountAddForm";

const sheetMessages = ledgerSetupAccountsMessages.addSheet;

type LedgerSetupAccountAddSheetProps = UseLedgerSetupAccountAddFormOptions & {
  onClose: () => void;
  open: boolean;
};

/**
 * 创建账本向导「添加账户」底部弹层：输入名称或从候选 Chip 中选择。
 * 弹层关闭后内容卸载，再次打开时输入重新开始。
 */
export function LedgerSetupAccountAddSheet({
  onAdd,
  onClose,
  open,
  ...formOptions
}: LedgerSetupAccountAddSheetProps) {
  const titleId = useId();
  const [dirty, setDirty] = useState(false);
  const wizardLayer = useBackLayerLevel();
  const guard = useUnsavedChangesGuard({
    active: open,
    isDirty: dirty,
    layer: (wizardLayer ?? 0) + 2,
    onClose: () => {
      setDirty(false);
      onClose();
    },
    saveFormId: null,
  });

  return (
    <AccountFormDialogShell
      onClose={guard.requestClose}
      open={open}
      titleId={titleId}
    >
      <LedgerSetupAccountAddForm
        {...formOptions}
        onAdd={(account) => {
          setDirty(false);
          onAdd(account);
        }}
        onClose={guard.requestClose}
        onDirtyChange={setDirty}
        titleId={titleId}
      />
      <UnsavedChangesDialog {...guard.dialogProps} />
    </AccountFormDialogShell>
  );
}

function LedgerSetupAccountAddForm({
  onClose,
  onDirtyChange,
  titleId,
  ...formOptions
}: UseLedgerSetupAccountAddFormOptions & {
  onClose: () => void;
  onDirtyChange: (dirty: boolean) => void;
  titleId: string;
}) {
  const { candidates, changeName, handleSubmit, name, nameError } =
    useLedgerSetupAccountAddForm(formOptions);
  function updateName(value: string) {
    changeName(value);
    onDirtyChange(value !== "");
  }

  const typeLabel = getAccountTypeLabel(formOptions.type);

  return (
    <Stack component="form" noValidate onSubmit={handleSubmit} spacing={2}>
      <Stack direction="row" sx={headerSx}>
        <Typography component="h2" id={titleId} sx={titleSx}>
          {sheetMessages.title(typeLabel)}
        </Typography>
        <IconButton aria-label={sheetMessages.close} onClick={onClose}>
          <CloseRoundedIcon />
        </IconButton>
      </Stack>

      <TextField
        autoFocus
        error={nameError !== null}
        fullWidth
        helperText={nameError}
        onChange={(event) => updateName(event.target.value)}
        placeholder={sheetMessages.namePlaceholder}
        slotProps={{ htmlInput: { "aria-label": sheetMessages.nameLabel } }}
        value={name}
      />

      {candidates.length > 0 ? (
        <Stack spacing={1}>
          <Typography component="h3" sx={candidatesTitleSx}>
            {sheetMessages.candidatesTitle(typeLabel)}
          </Typography>
          <Stack direction="row" sx={candidateListSx}>
            {candidates.map((candidate) => (
              <Chip
                aria-label={
                  candidate.added
                    ? `${candidate.name} ${sheetMessages.added}`
                    : candidate.name
                }
                aria-pressed={candidate.selected}
                icon={
                  candidate.added ? (
                    <CheckRoundedIcon data-testid="account-candidate-added" />
                  ) : undefined
                }
                key={candidate.name}
                label={candidate.name}
                onClick={() => updateName(candidate.name)}
                sx={candidate.selected ? selectedChipSx : chipSx}
                variant="outlined"
              />
            ))}
          </Stack>
        </Stack>
      ) : null}

      <PrimaryActionButton fullWidth type="submit">
        {sheetMessages.submit}
      </PrimaryActionButton>
    </Stack>
  );
}

const headerSx = {
  alignItems: "center",
  justifyContent: "space-between",
};

const titleSx = {
  fontSize: 20,
  fontWeight: 900,
};

const candidatesTitleSx = {
  color: "text.secondary",
  fontSize: 14,
  fontWeight: 800,
};

const candidateListSx = {
  flexWrap: "wrap",
  gap: 1,
};

const chipSx = {
  borderRadius: `${designTokens.radius.item}px`,
  fontWeight: 700,
  height: 36,
};

const selectedChipSx = {
  ...chipSx,
  "&&": {
    bgcolor: "var(--user-theme-field-card-selected-bg)",
    borderColor: "var(--user-theme-field-card-selected-border)",
    color: "primary.main",
  },
};
