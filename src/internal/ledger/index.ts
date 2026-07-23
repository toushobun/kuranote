import { ledgerManagementRouter } from "internal/ledger/managementRouter";
import { ledgerRouter } from "internal/ledger/router";
import type { InternalModule } from "internal/internalModule";

/** 保留既有邀请接受 URL，避免破坏已经发布的邀请链接。 */
export const ledgerInviteModule = {
  basePath: "/ledger-invites",
  name: "ledger-invites",
  router: ledgerRouter,
} satisfies InternalModule;

/** Ledger 创建、切换、设置和邀请管理的统一业务入口。 */
export const ledgerModule = {
  basePath: "/ledgers",
  name: "ledger",
  router: ledgerManagementRouter,
} satisfies InternalModule;
