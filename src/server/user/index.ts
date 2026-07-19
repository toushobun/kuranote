import type { ServerModule } from "server/serverModule";
import { userRouter } from "server/user/router";

/** 用户资料读取、更新及用户级偏好的统一业务入口。 */
export const userModule = {
  basePath: "/users",
  name: "user",
  router: userRouter,
} satisfies ServerModule;
