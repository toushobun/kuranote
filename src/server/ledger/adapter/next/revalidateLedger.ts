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
 * Server Action（账本切换、创建、设置、邀请）必须调用同一个模块级
 * 函数——不得各自维护一份 path 清单。
 *
 * @param extraPaths 除通用清单外，额外需要失效的路径（例如某个账本的
 * 设置页 `/ledgers/:id/settings`）。
 */
export function revalidateLedgerMutation(extraPaths: string[] = []): void {
  currentLedgerRevalidatePaths.forEach((path) => {
    revalidatePath(path);
  });
  extraPaths.forEach((path) => {
    revalidatePath(path);
  });
}
