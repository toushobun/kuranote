import { accountModule } from "internal/account";
import { authModule } from "internal/auth";
import { categoryModule } from "internal/category";
import { ledgerInviteModule, ledgerModule } from "internal/ledger";
import { merchantModule } from "internal/merchant";
import type { InternalModule } from "internal/internalModule";
import { statisticsModule } from "internal/statistics";
import { transactionModule } from "internal/transaction";
import { userModule } from "internal/user";

/** 集中登记业务模块，Master Router 只负责挂载。 */
export const internalModules = [
  authModule,
  ledgerModule,
  ledgerInviteModule,
  accountModule,
  categoryModule,
  merchantModule,
  transactionModule,
  statisticsModule,
  userModule,
] satisfies InternalModule[];
