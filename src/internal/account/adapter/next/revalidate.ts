import { revalidatePath } from "next/cache";

import { routePaths } from "config/paths";

/** Account 写操作成功后统一失效账户、交易记录和仪表盘缓存。 */
export function revalidateAccountMutation(): void {
  revalidatePath(routePaths.accounts);
  revalidatePath(routePaths.transactions);
  revalidatePath(routePaths.dashboard);
}
