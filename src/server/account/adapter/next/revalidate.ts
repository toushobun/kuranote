import { revalidatePath } from "next/cache";

import { routePaths } from "config/paths";

/** Account 写操作成功后统一失效账户页面缓存。 */
export function revalidateAccountMutation(): void {
  revalidatePath(routePaths.accounts);
}
