import { routePaths, routeWithQuery } from "config/paths";
import { getGoogleAuthErrorMessage } from "lib/auth/googleOAuth";
import { isSafeNextPath } from "lib/navigation/safeNextPath";
import { emailMaxLength, isValidEmailFormat } from "lib/validators/auth";
import { startGoogleAuth } from "server/actions/googleAuth";
import { loginWithRedirect } from "server/actions/loginRedirect";
import { isGoogleAuthEnabled } from "server/auth/googleAuthConfig";
import { redirectIfAuthenticated } from "server/loaders/login";
import { LoginTemplate } from "templates/login/Login";

type LoginRouteProps = {
  searchParams?: Promise<{
    authError?: string | string[];
    email?: string | string[];
    next?: string | string[];
  }>;
};

function getDefaultEmail(email: string | string[] | undefined) {
  if (typeof email !== "string") return "";

  const normalizedEmail = email.trim();

  if (normalizedEmail.length > emailMaxLength) return "";
  if (!isValidEmailFormat(normalizedEmail)) return "";

  return normalizedEmail;
}

function getNextPath(next: string | string[] | undefined) {
  if (typeof next !== "string") return routePaths.dashboard;
  return isSafeNextPath(next) ? next : routePaths.dashboard;
}

function getAuthErrorMessage(authError: string | string[] | undefined) {
  return typeof authError === "string"
    ? getGoogleAuthErrorMessage(authError)
    : undefined;
}

export default async function LoginRoute({ searchParams }: LoginRouteProps) {
  await redirectIfAuthenticated();
  const params = await searchParams;
  const nextPath = getNextPath(params?.next);
  const googleAuthEnabled = isGoogleAuthEnabled();

  return (
    <LoginTemplate
      action={loginWithRedirect.bind(null, nextPath)}
      defaultEmail={getDefaultEmail(params?.email)}
      googleAction={
        googleAuthEnabled
          ? startGoogleAuth.bind(null, "login", nextPath)
          : undefined
      }
      googleErrorMessage={getAuthErrorMessage(params?.authError)}
      registerHref={routeWithQuery(routePaths.register, { next: nextPath })}
    />
  );
}
