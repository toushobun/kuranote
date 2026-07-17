import { OpenAPIHono } from "@hono/zod-openapi";

import type { AppEnv } from "server/appEnv";
import { serverModules } from "server/moduleRegistry";
import { errorHandlingMiddleware } from "server/shared/http/errorResponse";
import { requestContextMiddleware } from "server/shared/middleware/requestContextMiddleware";

/**
 * Master Router：挂载全局 middleware、统一异常处理、统一 404，
 * 并把每个业务模块的 Router 挂载到各自的 basePath 下。
 */
export const apiRouter = new OpenAPIHono<AppEnv>().basePath("/api");

apiRouter.use("*", requestContextMiddleware);
apiRouter.onError(errorHandlingMiddleware);

apiRouter.notFound((c) =>
  c.json(
    {
      error: {
        code: "not_found",
        message: "请求的资源不存在。",
        requestId: c.get("requestId"),
        status: 404,
      },
    },
    404,
  ),
);

for (const serverModule of serverModules) {
  apiRouter.route(serverModule.basePath, serverModule.router);
}

export type ApiRouterType = typeof apiRouter;
