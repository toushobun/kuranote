import { useActionState, useEffect, useRef, useState } from "react";

import {
  displayNameMaxLength,
  emailMaxLength,
  isValidEmailFormat,
  isValidRegisterPassword,
  passwordMaxLength,
  passwordRuleMessage,
} from "lib/validators/auth";
import type { EmailAvailabilityState, RegisterActionState } from "types/auth";

type UseRegisterFormParams = {
  action: (
    prevState: RegisterActionState,
    formData: FormData,
  ) => Promise<RegisterActionState>;
  validateEmailFormatAction: (email: string) => Promise<EmailAvailabilityState>;
};

const initialState: RegisterActionState = {};

export function useRegisterForm({
  action,
  validateEmailFormatAction,
}: UseRegisterFormParams) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [displayNameError, setDisplayNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [emailCheckState, setEmailCheckState] =
    useState<EmailAvailabilityState>({});
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordConfirmError, setPasswordConfirmError] = useState("");
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const passwordConfirmInputRef = useRef<HTMLInputElement>(null);

  const validateDisplayNameLength = () => {
    if (!displayName || displayName.length <= displayNameMaxLength) {
      setDisplayNameError("");
      return true;
    }

    setDisplayNameError(`昵称最多 ${displayNameMaxLength} 个字符。`);
    return false;
  };

  const validateEmailFormat = () => {
    if (!email) {
      setEmailError("");
      return false;
    }

    if (email.length > emailMaxLength) {
      setEmailError(`邮箱最多 ${emailMaxLength} 个字符。`);
      return false;
    }

    if (!isValidEmailFormat(email)) {
      setEmailError("邮箱格式有误");
      return false;
    }

    setEmailError("");
    return true;
  };

  const validatePasswordStrength = () => {
    const password = passwordInputRef.current?.value ?? "";

    if (password.length > passwordMaxLength) {
      setPasswordError(`密码最多 ${passwordMaxLength} 个字符。`);
      return;
    }

    if (!password || isValidRegisterPassword(password)) {
      setPasswordError("");
      return;
    }

    setPasswordError(passwordRuleMessage);
  };

  const validatePasswordConfirm = () => {
    const password = passwordInputRef.current?.value ?? "";
    const passwordConfirm = passwordConfirmInputRef.current?.value ?? "";

    if (passwordConfirm.length > passwordMaxLength) {
      setPasswordConfirmError(`确认密码最多 ${passwordMaxLength} 个字符。`);
      return;
    }

    if (!passwordConfirm || password === passwordConfirm) {
      setPasswordConfirmError("");
      return;
    }

    setPasswordConfirmError("两次输入的密码不一致。");
  };

  const handleDisplayNameChange = (value: string) => {
    setDisplayName(value);
    setDisplayNameError("");
  };

  const handleDisplayNameBlur = () => {
    validateDisplayNameLength();
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    setEmailError("");
    setEmailCheckState({});
  };

  const handleEmailBlur = () => {
    validateEmailFormat();
  };

  const handlePasswordChange = () => {
    setPasswordError("");
    setPasswordConfirmError("");
  };

  const handlePasswordBlur = () => {
    validatePasswordStrength();
    validatePasswordConfirm();
  };

  const handlePasswordConfirmChange = () => {
    setPasswordConfirmError("");
  };

  const handlePasswordConfirmBlur = () => {
    validatePasswordConfirm();
  };

  const handleValidateEmailFormat = async () => {
    setEmailCheckState({});

    if (!validateEmailFormat()) {
      return;
    }

    setIsCheckingEmail(true);

    try {
      const result = await validateEmailFormatAction(email);
      setEmailCheckState(result);
    } finally {
      setIsCheckingEmail(false);
    }
  };

  useEffect(() => {
    if (!state.resetPassword) {
      return;
    }

    if (passwordInputRef.current) {
      passwordInputRef.current.value = "";
    }

    if (passwordConfirmInputRef.current) {
      passwordConfirmInputRef.current.value = "";
    }
  }, [state]);

  return {
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
  };
}
