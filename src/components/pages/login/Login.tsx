import { login } from "server/actions/auth";
import { loadLoginView } from "server/loaders/login";
import { LoginTemplate } from "templates/login/Login";

export async function LoginPage() {
  await loadLoginView();

  return <LoginTemplate action={login} />;
}
