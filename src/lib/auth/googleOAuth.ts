import { routePaths, routeWithQuery } from "config/paths";
import { isSafeNextPath } from "lib/navigation/safeNextPath";

export const googleAuthNextPathMaxLength = 2048;

export const googleAuthSources = {
  link: "link",
  login: "login",
  register: "register",
} as const;

export type GoogleAuthSource =
  (typeof googleAuthSources)[keyof typeof googleAuthSources];

/** 登录 / 注册页发起的 Google 登录来源；绑定由个人主页单独发起。 */
export type GoogleSignInSource = Exclude<
  GoogleAuthSource,
  typeof googleAuthSources.link
>;

export const googleAuthErrorCodes = {
  callbackFailed: "callback_failed",
  cancelled: "cancelled",
  startFailed: "start_failed",
} as const;

export type GoogleAuthErrorCode =
  (typeof googleAuthErrorCodes)[keyof typeof googleAuthErrorCodes];

/** 个人主页绑定 Google 的 OAuth 回跳结果，通过 linkResult 查询参数传回个人主页。 */
export const googleIdentityLinkResults = {
  cancelled: "cancelled",
  failed: "failed",
  identityAlreadyExists: "identity_already_exists",
  linked: "linked",
} as const;

export type GoogleIdentityLinkResult =
  (typeof googleIdentityLinkResults)[keyof typeof googleIdentityLinkResults];

export const googleIdentityLinkResultParam = "linkResult";

const googleAuthErrorMessages: Record<GoogleAuthErrorCode, string> = {
  callback_failed: "Google 登录未完成，请重新尝试或改用邮箱方式。",
  cancelled: "已取消 Google 授权，你可以重新尝试或改用邮箱方式。",
  start_failed: "暂时无法连接 Google，请稍后重试或改用邮箱方式。",
};

export function getGoogleAuthSource(
  value: string | null | undefined,
): GoogleAuthSource {
  if (value === googleAuthSources.register) return googleAuthSources.register;
  if (value === googleAuthSources.link) return googleAuthSources.link;
  return googleAuthSources.login;
}

/** 直接接收登录 / 注册页的 authError 查询参数，非字符串或未知错误码返回 undefined。 */
export function getGoogleAuthErrorMessage(
  value: string | string[] | undefined,
) {
  if (
    typeof value !== "string" ||
    !Object.prototype.hasOwnProperty.call(googleAuthErrorMessages, value)
  ) {
    return undefined;
  }

  return googleAuthErrorMessages[value as GoogleAuthErrorCode];
}

export function getSafeGoogleAuthNextPath(value: string | null | undefined) {
  return value &&
    value.length <= googleAuthNextPathMaxLength &&
    isSafeNextPath(value)
    ? value
    : routePaths.dashboard;
}

export function getGoogleIdentityLinkResult(
  value: string | null | undefined,
): GoogleIdentityLinkResult | null {
  return (
    Object.values(googleIdentityLinkResults).find(
      (result) => result === value,
    ) ?? null
  );
}

export function googleIdentityLinkResultHref(result: GoogleIdentityLinkResult) {
  return routeWithQuery(routePaths.settingsProfile, {
    [googleIdentityLinkResultParam]: result,
  });
}

export function googleAuthFailureHref(
  source: GoogleAuthSource,
  errorCode: GoogleAuthErrorCode,
  nextPath: string,
) {
  // 绑定失败统一回到个人主页，不进入登录 / 注册页。
  if (source === googleAuthSources.link) {
    return googleIdentityLinkResultHref(
      errorCode === googleAuthErrorCodes.cancelled
        ? googleIdentityLinkResults.cancelled
        : googleIdentityLinkResults.failed,
    );
  }

  const path =
    source === googleAuthSources.register
      ? routePaths.register
      : routePaths.login;

  return routeWithQuery(path, {
    authError: errorCode,
    next: getSafeGoogleAuthNextPath(nextPath),
  });
}
