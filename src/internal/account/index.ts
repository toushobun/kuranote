import { accountRouter } from "internal/account/router";
import type { InternalModule } from "internal/internalModule";

export {
  accountErrorCodes,
  isAccountErrorCode,
  type AccountErrorCode,
} from "internal/account/errors";

/** 账户读取、创建、更新和归档的统一业务入口。 */
export const accountModule = {
  basePath: "/ledgers",
  name: "account",
  router: accountRouter,
} satisfies InternalModule;
