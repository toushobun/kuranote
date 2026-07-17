import { ledgerModule } from "server/ledger";
import type { ServerModule } from "server/serverModule";

/**
 * 集中登记模块。新增业务模块时，只需创建模块目录、导出 Router，
 * 并在这里登记，不需要复制一套依赖组装模板。
 */
export const serverModules = [ledgerModule] satisfies ServerModule[];
