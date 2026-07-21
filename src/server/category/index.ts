import { categoryRouter } from "server/category/router";
import type { ServerModule } from "server/serverModule";

/** Category 创建、编辑、归档与排序的统一业务入口。 */
export const categoryModule = {
  basePath: "/categories",
  name: "category",
  router: categoryRouter,
} satisfies ServerModule;
