import { revalidatePath } from "next/cache";

import { routePaths } from "config/paths";

/** Merchant 写操作成功后的唯一缓存失效入口。 */
export function revalidateMerchantMutation() {
  revalidatePath(routePaths.merchants);
}
