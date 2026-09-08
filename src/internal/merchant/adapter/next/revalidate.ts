import { revalidatePath } from "next/cache";

import { merchantEditHref, routePaths } from "config/paths";

/** Merchant 写操作成功后的唯一缓存失效入口。 */
export function revalidateMerchantMutation(merchantId?: string) {
  revalidatePath(routePaths.merchants);
  if (merchantId) revalidatePath(merchantEditHref(merchantId));
}
