import { accountRouter } from "server/account/router";
import type { ServerModule } from "server/serverModule";

/** 账户读取、创建、更新和归档的统一业务入口。 */
export const accountModule = {
  basePath: "/ledgers",
  name: "account",
  router: accountRouter,
} satisfies ServerModule;
