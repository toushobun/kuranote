import { routePaths, routeWithQuery } from "config/paths";
import { isSafeNextPath } from "lib/navigation/safeNextPath";

export const googleAuthSources = {
  login: "login",
  register: "register",
} as const;

export type GoogleAuthSource =
  (typeof googleAuthSources)[keyof typeof googleAuthSources];

export const googleAuthErrorCodes = {
  callbackFailed: "callback_failed",
  cancelled: "cancelled",
  startFailed: "start_failed",
} as const;

export type GoogleAuthErrorCode =
  (typeof googleAuthErrorCodes)[keyof typeof googleAuthErrorCodes];

const googleAuthErrorMessages: Record<GoogleAuthErrorCode, string> = {
  callback_failed: "Google 登录未完成，请重新尝试或改用邮箱方式。",
  cancelled: "已取消 Google 授权，你可以重新尝试或改用邮箱方式。",
  start_failed: "暂时无法连接 Google，请稍后重试或改用邮箱方式。",
};

export function getGoogleAuthSource(value: string | null | undefined) {
  return value === googleAuthSources.register
    ? googleAuthSources.register
    : googleAuthSources.login;
}

export function getGoogleAuthErrorMessage(value: string | null | undefined) {
  if (
    !value ||
    !Object.prototype.hasOwnProperty.call(googleAuthErrorMessages, value)
  ) {
    return undefined;
  }

  return googleAuthErrorMessages[value as GoogleAuthErrorCode];
}

export function getSafeGoogleAuthNextPath(value: string | null | undefined) {
  return value && isSafeNextPath(value) ? value : routePaths.dashboard;
}

export function googleAuthFailureHref(
  source: GoogleAuthSource,
  errorCode: GoogleAuthErrorCode,
  nextPath: string,
) {
  const path =
    source === googleAuthSources.register
      ? routePaths.register
      : routePaths.login;

  return routeWithQuery(path, {
    authError: errorCode,
    next: getSafeGoogleAuthNextPath(nextPath),
  });
}
