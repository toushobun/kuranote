import { createRequestContainer } from "internal/container";
import { requireCurrentUserAndLedger } from "internal/ledger/adapter/next/currentLedger";
import { createServerRequestDependencies } from "internal/shared/context/createServerRequestDependencies";

/** 数据导入页 SSR 入口：读取当前账本的有效成员，供浏览器端判断哪些持有人需要映射。 */
export async function loadDataImportHolderMembers() {
  const { currentLedger, userId } = await requireCurrentUserAndLedger();
  const dependencies = await createServerRequestDependencies();

  return createRequestContainer(dependencies)
    .dataImport.createExecutionService(currentLedger)
    .listHolderMembers({ ledgerId: currentLedger.id, userId });
}
