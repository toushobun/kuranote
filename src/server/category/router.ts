import { OpenAPIHono } from "@hono/zod-openapi";

import type { AppEnv } from "server/appEnv";
import {
  archiveCategoryHandler,
  archiveCategoryRoute,
  createCategoryHandler,
  createCategoryRoute,
  reorderCategoriesHandler,
  reorderCategoriesRoute,
  updateCategoryHandler,
  updateCategoryRoute,
} from "server/category/controller/categoryController";
import { sameOriginMiddleware } from "server/shared/middleware/sameOriginMiddleware";

export const categoryRouter = new OpenAPIHono<AppEnv>();

categoryRouter.use("*", sameOriginMiddleware);
categoryRouter.openapi(createCategoryRoute, createCategoryHandler);
categoryRouter.openapi(updateCategoryRoute, updateCategoryHandler);
categoryRouter.openapi(archiveCategoryRoute, archiveCategoryHandler);
categoryRouter.openapi(reorderCategoriesRoute, reorderCategoriesHandler);
