import { ledgerManagementRouter } from "server/ledger/managementRouter";
import { ledgerRouter } from "server/ledger/router";
import type { ServerModule } from "server/serverModule";

/** 保留既有邀请接受 URL，避免破坏已经发布的邀请链接。 */
export const ledgerInviteModule = {
  basePath: "/ledger-invites",
  name: "ledger-invites",
  router: ledgerRouter,
} satisfies ServerModule;

/** Ledger 创建、切换、设置和邀请管理的统一业务入口。 */
export const ledgerModule = {
  basePath: "/ledgers",
  name: "ledger",
  router: ledgerManagementRouter,
} satisfies ServerModule;
