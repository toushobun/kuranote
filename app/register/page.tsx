import { routePaths, routeWithQuery } from "config/paths";
import { isSafeNextPath } from "lib/navigation/safeNextPath";
import {
  checkRegisterEmailAvailability,
  requestRegisterOtp,
} from "server/actions/auth";
import { submitRegisterOtpWithRedirect } from "server/actions/loginRedirect";
import { getTurnstileSiteKey } from "server/auth/turnstileKeys";
import { redirectIfAuthenticated } from "server/loaders/login";
import { RegisterTemplate } from "templates/register/Register";

function getNextPath(next: string | string[] | undefined) {
  if (typeof next !== "string") return routePaths.dashboard;
  return isSafeNextPath(next) ? next : routePaths.dashboard;
}

export default async function RegisterRoute({
  searchParams,
}: {
  searchParams?: Promise<{ next?: string | string[] }>;
}) {
  await redirectIfAuthenticated();
  const params = await searchParams;
  const nextPath = getNextPath(params?.next);
  const turnstileSiteKey = getTurnstileSiteKey();

  return (
    <RegisterTemplate
      checkEmailAvailabilityAction={checkRegisterEmailAvailability}
      loginHref={routeWithQuery(routePaths.login, { next: nextPath })}
      requestOtpAction={requestRegisterOtp}
      submitOtpAction={submitRegisterOtpWithRedirect.bind(null, nextPath)}
      turnstileSiteKey={turnstileSiteKey}
    />
  );
}
