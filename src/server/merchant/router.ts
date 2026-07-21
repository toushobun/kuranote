import { OpenAPIHono } from "@hono/zod-openapi";

import type { AppEnv } from "server/appEnv";
import {
  archiveMerchantAliasHandler,
  archiveMerchantAliasRoute,
  archiveMerchantHandler,
  archiveMerchantRoute,
  createMerchantAliasHandler,
  createMerchantAliasRoute,
  createMerchantHandler,
  createMerchantRoute,
  listMerchantOptionsHandler,
  listMerchantOptionsRoute,
  listMerchantsHandler,
  listMerchantsRoute,
  updateMerchantHandler,
  updateMerchantRoute,
} from "server/merchant/controller/merchantController";
import { sameOriginMiddleware } from "server/shared/middleware/sameOriginMiddleware";

export const merchantRouter = new OpenAPIHono<AppEnv>();

merchantRouter.use("*", sameOriginMiddleware);
merchantRouter.openapi(listMerchantsRoute, listMerchantsHandler);
merchantRouter.openapi(listMerchantOptionsRoute, listMerchantOptionsHandler);
merchantRouter.openapi(createMerchantRoute, createMerchantHandler);
merchantRouter.openapi(updateMerchantRoute, updateMerchantHandler);
merchantRouter.openapi(archiveMerchantRoute, archiveMerchantHandler);
merchantRouter.openapi(createMerchantAliasRoute, createMerchantAliasHandler);
merchantRouter.openapi(archiveMerchantAliasRoute, archiveMerchantAliasHandler);
