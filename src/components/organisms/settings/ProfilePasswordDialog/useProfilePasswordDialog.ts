"use client";

import {
  useActionState,
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";

import { profilePasswordDialogMessages as text } from "config/settingsMessages";
import type { OperationFeedbackState } from "molecules/ui/OperationFeedbackDialogs";
import { useOtpCooldown } from "organisms/auth/useOtpCooldown";
import type {
  ChangePasswordAction,
  ChangePasswordActionState,
  PasswordChangeOtpAction,
  PasswordChangeOtpActionState,
} from "types/auth";

const initialOtpState: PasswordChangeOtpActionState = {};
const initialChangeState: ChangePasswordActionState = {};

/**
 * 修改密码流程：发送验证码到登录邮箱 → 输入验证码与新密码 → 提交 Server Action。
 * 关闭弹框不清除「已发送」状态与倒计时，重新打开后可继续输入收到的验证码。
 */
export function useProfilePasswordDialog({
  changePasswordAction,
  onClose,
  open,
  requestOtpAction,
}: {
  changePasswordAction: ChangePasswordAction;
  onClose: () => void;
  open: boolean;
  requestOtpAction: PasswordChangeOtpAction;
}) {
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [sentMessage, setSentMessage] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<OperationFeedbackState | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useOtpCooldown();
  const [wasOpen, setWasOpen] = useState(open);
  const [, startTransition] = useTransition();
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  function clearInputs() {
    setToken("");
    setPassword("");
    setPasswordConfirm("");
  }

  // 每次打开时清空输入（渲染期间根据 props 变化调整 state）。
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) clearInputs();
  }

  const trackedRequestOtpAction = useCallback<PasswordChangeOtpAction>(
    async (previousState) => {
      const nextState = await requestOtpAction(previousState);

      if (nextState.retryAfterSeconds) {
        setCooldownSeconds(nextState.retryAfterSeconds);
      }
      if (nextState.error) {
        setFeedback({
          kind: "failure",
          message: nextState.error,
          title: text.sendFailureTitle,
        });
      } else if (nextState.success) {
        setSentMessage(nextState.success);
      }

      return nextState;
    },
    [requestOtpAction, setCooldownSeconds],
  );
  const [, requestOtpFormAction, isSending] = useActionState(
    trackedRequestOtpAction,
    initialOtpState,
  );

  const trackedChangePasswordAction = useCallback<ChangePasswordAction>(
    async (previousState, formData) => {
      const nextState = await changePasswordAction(previousState, formData);

      if (nextState.error) {
        setFeedback({
          kind: "failure",
          message: nextState.error,
          title: text.failureTitle,
        });
      } else if (nextState.success) {
        setFeedback({ kind: "success", title: text.successTitle });
        setSentMessage(null);
        onCloseRef.current();
      }

      return nextState;
    },
    [changePasswordAction],
  );
  const [, changePasswordFormAction, isSaving] = useActionState(
    trackedChangePasswordAction,
    initialChangeState,
  );

  const pending = isSending || isSaving;
  const otpSent = sentMessage !== null;

  function sendOtp() {
    startTransition(() => requestOtpFormAction());
  }

  function save() {
    const formData = new FormData();
    formData.set("token", token.trim());
    formData.set("password", password);
    formData.set("passwordConfirm", passwordConfirm);
    startTransition(() => changePasswordFormAction(formData));
  }

  return {
    canSave:
      otpSent &&
      token.trim().length > 0 &&
      password.length > 0 &&
      passwordConfirm.length > 0 &&
      !pending,
    canSendOtp: cooldownSeconds <= 0 && !pending,
    closeFeedback: () => setFeedback(null),
    cooldownSeconds,
    feedback,
    isSending,
    isSaving,
    otpSent,
    password,
    passwordConfirm,
    pending,
    save,
    sendOtp,
    sentMessage,
    setPassword,
    setPasswordConfirm,
    setToken,
    token,
  };
}
