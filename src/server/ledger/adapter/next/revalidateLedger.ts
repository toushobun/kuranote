import { revalidatePath } from "next/cache";

import { currentLedgerRevalidatePaths } from "server/cache/currentLedger";

/**
 * 账本邀请接受成功后需要失效的页面路径。Hono Controller 与后续保留的
 * Server Action（如仍处理账本切换 / 创建）必须调用同一个模块级函数，
 * 不得各自维护一份 path 清单。
 *
 * 复用 server/cache/currentLedger 中已有的路径清单，避免重复定义；
 * 该清单后续随 Ledger 模块整体迁移（#472）一并收编进本目录。
 */
export function revalidateLedgerInviteAccepted(): void {
  currentLedgerRevalidatePaths.forEach((path) => {
    revalidatePath(path);
  });
}
