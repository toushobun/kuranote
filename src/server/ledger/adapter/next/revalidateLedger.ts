import { revalidatePath } from "next/cache";

import { routePaths } from "config/paths";

/**
 * 依赖 current ledger 的核心页面路径。任何切换 / 创建账本或接受账本
 * 邀请等会改变"当前账本可见范围"的写操作，成功后都需要失效这些路径。
 */
export const currentLedgerRevalidatePaths = [
  routePaths.dashboard,
  routePaths.transactions,
  routePaths.transactionsNew,
  routePaths.transactionsSearch,
  routePaths.accounts,
  routePaths.categories,
  routePaths.merchants,
  routePaths.statistics,
  routePaths.settings,
  routePaths.ledgers,
] as const;

/**
 * Ledger 模块统一的缓存失效函数。Hono Controller 与仍然保留的
 * Server Action（账本切换、创建）必须调用同一个模块级函数——
 * 不得各自维护一份 path 清单。
 *
 * `src/server/cache/currentLedger.ts` 目前把 `revalidateCurrentLedgerPaths`
 * re-export 到这里，保证旧调用方（账本切换 / 创建 Server Action）
 * 无需改动 import 路径，也自动共用同一份实现。
 */
export function revalidateLedgerMutation(): void {
  currentLedgerRevalidatePaths.forEach((path) => {
    revalidatePath(path);
  });
}
