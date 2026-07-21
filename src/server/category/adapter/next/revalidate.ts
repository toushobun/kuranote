import { revalidatePath } from "next/cache";

import { routePaths } from "config/paths";

/** Category 写操作唯一的模块级缓存失效入口。 */
export function revalidateCategoryMutation(): void {
  revalidatePath(routePaths.categories);
}
