import { createRequestContainer } from "internal/container";
import { canManageMembers } from "internal/ledger";
import { requireCurrentUserAndLedger } from "internal/ledger/adapter/next/currentLedger";
import { createServerRequestDependencies } from "internal/shared/context/createServerRequestDependencies";

/**
 * 数据导入页 SSR 入口：读取当前账本的有效成员与未认领待邀请成员（实时名字），
 * 供浏览器端判断哪些持有人需要映射并提供下拉候选。`canManageMembers` 只决定是否
 * 显示「新建待邀请成员」，服务端执行时仍会独立校验权限。
 */
export async function loadDataImportHolderMappingOptions() {
  const { currentLedger, userId } = await requireCurrentUserAndLedger();
  const dependencies = await createServerRequestDependencies();

  const options = await createRequestContainer(dependencies)
    .dataImport.createExecutionService(currentLedger)
    .loadHolderMappingOptions({ ledgerId: currentLedger.id, userId });

  return {
    ...options,
    canManageMembers: canManageMembers(currentLedger.currentUserRole),
  };
}
