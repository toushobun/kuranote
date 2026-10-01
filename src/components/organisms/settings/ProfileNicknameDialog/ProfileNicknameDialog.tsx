"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import { useId, type FormEvent } from "react";

import { profileNicknameDialogMessages as text } from "config/settingsMessages";
import {
  displayNameMaxLength,
  type UserLedgerDisplayName,
} from "internal/user";
import { OperationFeedback } from "molecules/ui/OperationFeedbackDialogs";
import { bottomNavigationLayout } from "organisms/navigation/bottomNavigationLayout";
import { LedgerNicknameSyncDialog } from "organisms/settings/LedgerNicknameSyncDialog/LedgerNicknameSyncDialog";
import type { DisplayNameAction } from "types/user";

import { useProfileNicknameDialog } from "./useProfileNicknameDialog";

type ProfileNicknameDialogProps = {
  action: DisplayNameAction;
  currentDisplayName: string;
  currentLedgerId: string | null;
  ledgers: readonly UserLedgerDisplayName[];
  onClose: () => void;
  open: boolean;
};

/**
 * 修改昵称弹框。有所属账本时，保存前弹出「同步账本昵称」确认；
 * 弹框关闭后仍保持挂载，以便展示 Action 结果反馈。
 */
export function ProfileNicknameDialog({
  action,
  currentDisplayName,
  currentLedgerId,
  ledgers,
  onClose,
  open,
}: ProfileNicknameDialogProps) {
  const titleId = useId();
  const dialog = useProfileNicknameDialog({
    action,
    currentDisplayName,
    currentLedgerId,
    ledgers,
    onClose,
    open,
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    dialog.save();
  }

  return (
    <>
      <Dialog
        aria-labelledby={titleId}
        fullWidth
        maxWidth="xs"
        onClose={dialog.pending ? undefined : onClose}
        open={open && dialog.step === "edit"}
      >
        <Box component="form" noValidate onSubmit={handleSubmit}>
          <DialogTitle id={titleId}>{text.title}</DialogTitle>
          <DialogContent>
            <TextField
              autoComplete="off"
              autoFocus
              fullWidth
              helperText={text.helperText}
              label={text.label}
              margin="dense"
              name="displayName"
              onChange={(event) => dialog.setDisplayName(event.target.value)}
              slotProps={{ htmlInput: { maxLength: displayNameMaxLength } }}
              value={dialog.displayName}
            />
          </DialogContent>
          <DialogActions sx={actionsSx}>
            <Button
              disabled={dialog.pending}
              onClick={onClose}
              type="button"
              variant="outlined"
            >
              {text.cancel}
            </Button>
            <Button
              disabled={!dialog.canSave}
              startIcon={
                dialog.pending ? (
                  <CircularProgress color="inherit" size={18} />
                ) : undefined
              }
              type="submit"
              variant="contained"
            >
              {text.save}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <LedgerNicknameSyncDialog
        displayName={dialog.trimmedDisplayName}
        ledgers={ledgers}
        onClose={dialog.backToEdit}
        onConfirm={dialog.confirmSync}
        onOnlyPersonal={dialog.saveOnlyPersonal}
        onSelectAll={dialog.selectAll}
        onSelectNone={dialog.selectNone}
        onToggle={dialog.toggleLedger}
        open={open && dialog.step === "sync"}
        pending={dialog.pending}
        selectedLedgerIds={dialog.selectedLedgerIds}
      />

      <OperationFeedback
        aboveModal
        bottomOffset={bottomNavigationLayout.feedbackBottomOffset}
        feedback={dialog.feedback}
        onClose={dialog.closeFeedback}
      />
    </>
  );
}

const actionsSx = {
  px: 3,
  pb: 2.5,
};
