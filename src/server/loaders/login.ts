import { redirect } from "next/navigation";

import { routePaths } from "config/paths";
import { isSafeNextPath } from "lib/navigation/safeNextPath";
import { createClient } from "lib/supabase/server";

export async function redirectIfAuthenticated(
  nextPath: string = routePaths.dashboard,
) {
  let isAuthenticated = false;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    isAuthenticated = error === null && data.user !== null;
  } catch {
    // 登录与注册页本身就是公开入口。认证探测失败时继续显示页面，
    // 不记录异常原文，避免会话内容进入日志。
    console.error("[login] failed to probe existing authentication");
  }

  if (isAuthenticated) {
    redirect(isSafeNextPath(nextPath) ? nextPath : routePaths.dashboard);
  }
}
