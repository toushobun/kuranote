import { accountModule } from "server/account";
import { authModule } from "server/auth";
import { categoryModule } from "server/category";
import { ledgerInviteModule, ledgerModule } from "server/ledger";
import { merchantModule } from "server/merchant";
import type { ServerModule } from "server/serverModule";
import { statisticsModule } from "server/statistics";
import { transactionModule } from "server/transaction";
import { userModule } from "server/user";

/** 集中登记业务模块，Master Router 只负责挂载。 */
export const serverModules = [
  authModule,
  ledgerModule,
  ledgerInviteModule,
  accountModule,
  categoryModule,
  merchantModule,
  transactionModule,
  statisticsModule,
  userModule,
] satisfies ServerModule[];
