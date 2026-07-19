import { revalidatePath } from "next/cache";

import { routePaths } from "config/paths";

export const userProfileRevalidatePaths = [
  routePaths.dashboard,
  routePaths.transactions,
  routePaths.transactionsNew,
  routePaths.transactionsSearch,
  routePaths.accounts,
  routePaths.statistics,
  routePaths.settings,
  routePaths.ledgers,
] as const;

/** 用户资料写入成功后统一失效会显示昵称或头像的页面。 */
export function revalidateUserProfileMutation(): void {
  userProfileRevalidatePaths.forEach((path) => revalidatePath(path));
  revalidatePath("/ledgers/[ledgerId]/settings", "page");
}
