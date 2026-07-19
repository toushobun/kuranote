import { ledgerInviteModule, ledgerModule } from "server/ledger";
import type { ServerModule } from "server/serverModule";
import { userModule } from "server/user";

/** 集中登记业务模块，Master Router 只负责挂载。 */
export const serverModules = [
  ledgerModule,
  ledgerInviteModule,
  userModule,
] satisfies ServerModule[];
