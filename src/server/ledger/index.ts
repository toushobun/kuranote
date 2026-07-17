import { ledgerRouter } from "server/ledger/router";
import type { ServerModule } from "server/serverModule";

/**
 * basePath 沿用旧 Route Handler 的 URL（/api/ledger-invites/accept），
 * 保持对外 URL 不变。#472 迁移账本其余功能时，会把该模块整体收敛到
 * 统一的 /ledgers 基础路径下。
 */
export const ledgerModule = {
  basePath: "/ledger-invites",
  name: "ledger",
  router: ledgerRouter,
} satisfies ServerModule;
