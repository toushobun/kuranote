import { authRouter } from "server/auth/router";
import type { ServerModule } from "server/serverModule";

/** 登录、注册、OTP、OAuth 与 Session 的统一认证业务入口。 */
export const authModule = {
  basePath: "/auth",
  name: "auth",
  router: authRouter,
} satisfies ServerModule;
