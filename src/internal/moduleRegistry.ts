import { accountRouter } from "internal/account/router";
import { authRouter } from "internal/auth/router";
import { categoryRouter } from "internal/category/router";
import type { InternalModule } from "internal/internalModule";
import { ledgerInviteRouter } from "internal/ledger/inviteRouter";
import { ledgerRouter } from "internal/ledger/router";
import { merchantRouter } from "internal/merchant/router";
import { statisticsRouter } from "internal/statistics/router";
import { transactionRouter } from "internal/transaction/router";
import { userRouter } from "internal/user/router";

/** 集中登记业务模块和 basePath，Master Router 只负责挂载。 */
export const internalModules = [
  { basePath: "/auth", name: "auth", router: authRouter },
  { basePath: "/ledgers", name: "ledger", router: ledgerRouter },
  {
    basePath: "/ledger-invites",
    name: "ledger-invites",
    router: ledgerInviteRouter,
  },
  { basePath: "/ledgers", name: "account", router: accountRouter },
  { basePath: "/categories", name: "category", router: categoryRouter },
  { basePath: "/merchants", name: "merchant", router: merchantRouter },
  {
    basePath: "/transactions",
    name: "transaction",
    router: transactionRouter,
  },
  {
    basePath: "/statistics",
    name: "statistics",
    router: statisticsRouter,
  },
  { basePath: "/users", name: "user", router: userRouter },
] satisfies InternalModule[];
