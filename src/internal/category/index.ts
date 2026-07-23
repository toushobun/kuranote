import { categoryRouter } from "internal/category/router";
import type { InternalModule } from "internal/internalModule";

export {
  categoryErrorCodes,
  type CategoryErrorCode,
  type CategoryValidationErrorCode,
} from "internal/category/categoryErrors";

/** Category 创建、编辑、归档与排序的统一业务入口。 */
export const categoryModule = {
  basePath: "/categories",
  name: "category",
  router: categoryRouter,
} satisfies InternalModule;
