"use client";

import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { displayNameMaxLength, passwordRuleText } from "lib/validators/auth";
import type { EmailAvailabilityState, RegisterActionState } from "types/auth";

import { useRegisterForm } from "./useRegisterForm";

type RegisterFormProps = {
  action: (
    prevState: RegisterActionState,
    formData: FormData,
  ) => Promise<RegisterActionState>;
  validateEmailFormatAction: (email: string) => Promise<EmailAvailabilityState>;
};

const shrinkInputLabelSlotProps = {
  inputLabel: {
    shrink: true,
  },
} as const;

export function RegisterForm({
  action,
  validateEmailFormatAction,
}: RegisterFormProps) {
  const {
    displayName,
    displayNameError,
    email,
    emailCheckState,
    emailError,
    formAction,
    handleDisplayNameBlur,
    handleDisplayNameChange,
    handleEmailBlur,
    handleEmailChange,
    handlePasswordBlur,
    handlePasswordChange,
    handlePasswordConfirmBlur,
    handlePasswordConfirmChange,
    handleValidateEmailFormat,
    isCheckingEmail,
    isPending,
    passwordConfirmError,
    passwordConfirmInputRef,
    passwordError,
    passwordInputRef,
    state,
  } = useRegisterForm({ action, validateEmailFormatAction });

  return (
    <Box
      component="form"
      action={formAction}
      sx={{
        display: "grid",
        gap: 2,
      }}
    >
      {state.error ? <Alert severity="error">{state.error}</Alert> : null}
      {state.success ? <Alert severity="success">{state.success}</Alert> : null}

      <TextField
        label="邮箱"
        name="email"
        type="email"
        autoComplete="email"
        error={Boolean(emailError)}
        helperText={emailError || undefined}
        placeholder="name@example.com"
        value={email}
        onBlur={handleEmailBlur}
        onChange={(event) => {
          handleEmailChange(event.target.value);
        }}
        required
        fullWidth
        slotProps={{
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <Button
                  type="button"
                  variant="text"
                  size="small"
                  onClick={handleValidateEmailFormat}
                  disabled={isCheckingEmail || !email}
                  sx={{ minWidth: 48, px: 1, whiteSpace: "nowrap" }}
                >
                  {isCheckingEmail ? "校验中" : "校验"}
                </Button>
              </InputAdornment>
            ),
          },
          inputLabel: shrinkInputLabelSlotProps.inputLabel,
        }}
      />
      {emailCheckState.error ? (
        <Typography color="error" role="alert" variant="body2">
          {emailCheckState.error}
        </Typography>
      ) : null}
      {emailCheckState.success ? (
        <Box
          role="status"
          sx={{
            alignItems: "center",
            color: "success.main",
            display: "flex",
            gap: 0.75,
          }}
        >
          <CheckCircleOutlineRoundedIcon color="success" fontSize="small" />
          <Typography color="inherit" variant="body2">
            {emailCheckState.success}
          </Typography>
        </Box>
      ) : null}

      <TextField
        label="昵称"
        name="displayName"
        type="text"
        autoComplete="name"
        error={Boolean(displayNameError)}
        helperText={displayNameError || undefined}
        placeholder={`输入昵称，最多 ${displayNameMaxLength} 个字符`}
        value={displayName}
        onBlur={handleDisplayNameBlur}
        onChange={(event) => {
          handleDisplayNameChange(event.target.value);
        }}
        required
        fullWidth
        slotProps={shrinkInputLabelSlotProps}
      />

      <TextField
        label="密码"
        name="password"
        type="password"
        autoComplete="new-password"
        error={Boolean(passwordError)}
        helperText={passwordError || undefined}
        inputRef={passwordInputRef}
        onBlur={handlePasswordBlur}
        onChange={handlePasswordChange}
        placeholder={passwordRuleText}
        required
        fullWidth
        slotProps={shrinkInputLabelSlotProps}
      />

      <TextField
        label="确认密码"
        name="passwordConfirm"
        type="password"
        autoComplete="new-password"
        error={Boolean(passwordConfirmError)}
        helperText={passwordConfirmError || undefined}
        inputRef={passwordConfirmInputRef}
        onBlur={handlePasswordConfirmBlur}
        onChange={handlePasswordConfirmChange}
        placeholder="再次输入相同密码"
        required
        fullWidth
        slotProps={shrinkInputLabelSlotProps}
      />

      <Button
        type="submit"
        variant="contained"
        size="large"
        disabled={isPending}
        fullWidth
      >
        {isPending ? "注册中..." : "注册"}
      </Button>
    </Box>
  );
}
