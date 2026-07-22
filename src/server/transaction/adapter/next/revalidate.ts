import { revalidatePath } from "next/cache";

import { routePaths, transactionEditPagePath } from "config/paths";

/** Transaction 写操作成功后的唯一缓存失效入口。 */
export function revalidateTransactionMutation() {
  revalidatePath(routePaths.accounts);
  revalidatePath(routePaths.transactions);
  revalidatePath(routePaths.transactionsNew);
  revalidatePath(transactionEditPagePath, "page");
}
