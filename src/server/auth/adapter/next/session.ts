import { redirect } from "next/navigation";

import { routePaths } from "config/paths";
import { isSafeNextPath } from "lib/navigation/safeNextPath";
import { createRequestContainer } from "server/container";
import { createServerRequestDependencies } from "server/shared/context/createServerRequestDependencies";

export async function redirectIfAuthenticated(
  nextPath: string = routePaths.dashboard,
): Promise<void> {
  let authenticated = false;

  try {
    const dependencies = await createServerRequestDependencies();
    const session =
      await createRequestContainer(dependencies).auth.service.getSession();
    authenticated = session.authenticated;
  } catch {
    // 登录和注册页是公开入口，Session 探测失败时继续显示页面。
    console.error("[login] failed to probe existing authentication");
  }

  if (authenticated) {
    redirect(isSafeNextPath(nextPath) ? nextPath : routePaths.dashboard);
  }
}
