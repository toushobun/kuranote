"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useId, type FormEvent } from "react";

import { profilePasswordDialogMessages as text } from "config/settingsMessages";
import { passwordMaxLength } from "lib/validators/auth";
import { OperationFeedback } from "molecules/ui/OperationFeedbackDialogs";
import { bottomNavigationLayout } from "organisms/navigation/bottomNavigationLayout";
import type { ChangePasswordAction, PasswordChangeOtpAction } from "types/auth";

import { useProfilePasswordDialog } from "./useProfilePasswordDialog";

type ProfilePasswordDialogProps = {
  changePasswordAction: ChangePasswordAction;
  email: string | null;
  onClose: () => void;
  open: boolean;
  requestOtpAction: PasswordChangeOtpAction;
};

/**
 * 修改密码弹框。所有用户（包括尚未设置密码的 Google 用户）都通过登录邮箱验证码确认本人后设置新密码；
 * 弹框关闭后仍保持挂载，以便展示 Action 结果反馈。
 */
export function ProfilePasswordDialog({
  changePasswordAction,
  email,
  onClose,
  open,
  requestOtpAction,
}: ProfilePasswordDialogProps) {
  const titleId = useId();
  const dialog = useProfilePasswordDialog({
    changePasswordAction,
    onClose,
    open,
    requestOtpAction,
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (dialog.canSave) dialog.save();
  }

  return (
    <>
      <Dialog
        aria-labelledby={titleId}
        fullWidth
        maxWidth="xs"
        onClose={dialog.pending ? undefined : onClose}
        open={open}
      >
        <Box component="form" noValidate onSubmit={handleSubmit}>
          <DialogTitle id={titleId}>{text.title}</DialogTitle>
          <DialogContent>
            <Stack spacing={2}>
              <Typography color="text.secondary" variant="body2">
                {text.description(email)}
              </Typography>
              <Button
                disabled={!dialog.canSendOtp}
                onClick={dialog.sendOtp}
                startIcon={
                  dialog.isSending ? (
                    <CircularProgress color="inherit" size={18} />
                  ) : undefined
                }
                type="button"
                variant="outlined"
              >
                {dialog.cooldownSeconds > 0
                  ? text.resendCooldown(dialog.cooldownSeconds)
                  : dialog.otpSent
                    ? text.resendOtp
                    : text.sendOtp}
              </Button>
              {dialog.otpSent ? (
                <>
                  <Typography
                    color="success.main"
                    role="status"
                    variant="body2"
                  >
                    {dialog.sentMessage}
                  </Typography>
                  <TextField
                    autoComplete="one-time-code"
                    fullWidth
                    label={text.tokenLabel}
                    name="token"
                    onChange={(event) => dialog.setToken(event.target.value)}
                    slotProps={{
                      htmlInput: { inputMode: "numeric", maxLength: 6 },
                    }}
                    value={dialog.token}
                  />
                  <TextField
                    autoComplete="new-password"
                    fullWidth
                    helperText={text.passwordHelperText}
                    label={text.passwordLabel}
                    name="password"
                    onChange={(event) => dialog.setPassword(event.target.value)}
                    slotProps={{ htmlInput: { maxLength: passwordMaxLength } }}
                    type="password"
                    value={dialog.password}
                  />
                  <TextField
                    autoComplete="new-password"
                    fullWidth
                    label={text.passwordConfirmLabel}
                    name="passwordConfirm"
                    onChange={(event) =>
                      dialog.setPasswordConfirm(event.target.value)
                    }
                    slotProps={{ htmlInput: { maxLength: passwordMaxLength } }}
                    type="password"
                    value={dialog.passwordConfirm}
                  />
                </>
              ) : null}
            </Stack>
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
                dialog.isSaving ? (
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
