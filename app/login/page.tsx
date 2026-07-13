import { routePaths, routeWithQuery } from "config/paths";
import { isSafeNextPath } from "lib/navigation/safeNextPath";
import { emailMaxLength, isValidEmailFormat } from "lib/validators/auth";
import { loginWithRedirect } from "server/actions/loginRedirect";
import { redirectIfAuthenticated } from "server/loaders/login";
import { LoginTemplate } from "templates/login/Login";

type LoginRouteProps = {
  searchParams?: Promise<{
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

export default async function LoginRoute({ searchParams }: LoginRouteProps) {
  await redirectIfAuthenticated();
  const params = await searchParams;
  const nextPath = getNextPath(params?.next);

  return (
    <LoginTemplate
      action={loginWithRedirect.bind(null, nextPath)}
      defaultEmail={getDefaultEmail(params?.email)}
      registerHref={routeWithQuery(routePaths.register, { next: nextPath })}
    />
  );
}
