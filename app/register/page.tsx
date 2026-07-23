import { routePaths, routeWithQuery } from "config/paths";
import { getGoogleAuthErrorMessage } from "lib/auth/googleOAuth";
import { isSafeNextPath } from "lib/navigation/safeNextPath";
import {
  checkRegisterEmailAvailability,
  requestRegisterOtp,
  startGoogleAuth,
  submitRegisterOtpWithRedirect,
} from "internal/auth/adapter/next/actions";
import { isGoogleAuthEnabled } from "internal/auth/googleAuthConfig";
import { getTurnstileSiteKey } from "internal/auth/turnstileKeys";
import { redirectIfAuthenticated } from "internal/auth/adapter/next/session";
import { RegisterTemplate } from "templates/register/Register";

function getNextPath(next: string | string[] | undefined) {
  if (typeof next !== "string") return routePaths.dashboard;
  return isSafeNextPath(next) ? next : routePaths.dashboard;
}

function getAuthErrorMessage(authError: string | string[] | undefined) {
  return typeof authError === "string"
    ? getGoogleAuthErrorMessage(authError)
    : undefined;
}

export default async function RegisterRoute({
  searchParams,
}: {
  searchParams?: Promise<{
    authError?: string | string[];
    next?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const nextPath = getNextPath(params?.next);
  await redirectIfAuthenticated(nextPath);
  const googleAuthEnabled = isGoogleAuthEnabled();
  const turnstileSiteKey = getTurnstileSiteKey();

  return (
    <RegisterTemplate
      checkEmailAvailabilityAction={checkRegisterEmailAvailability}
      googleAction={
        googleAuthEnabled
          ? startGoogleAuth.bind(null, "register", nextPath)
          : undefined
      }
      googleErrorMessage={getAuthErrorMessage(params?.authError)}
      loginHref={routeWithQuery(routePaths.login, { next: nextPath })}
      requestOtpAction={requestRegisterOtp}
      submitOtpAction={submitRegisterOtpWithRedirect.bind(null, nextPath)}
      turnstileSiteKey={turnstileSiteKey}
    />
  );
}
