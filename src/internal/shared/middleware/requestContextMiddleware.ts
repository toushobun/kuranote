import type { MiddlewareHandler } from "hono";

import type { AppEnv } from "internal/appEnv";
import { createRequestContainer } from "internal/container";
import { createRequestDependencies } from "internal/shared/context/requestDependencies";

/**
 * 从 Request 创建 RequestDependencies，组装 Request Container，
 * 写入 Hono Context 供 Controller 使用。
 *
 * 注意：这里直接调用 createRequestDependencies()，不使用
 * React.cache() 包装的 SSR 专用入口——那个入口只用于 Server Component
 * 渲染路径。
 */
export const requestContextMiddleware: MiddlewareHandler<AppEnv> = async (
  c,
  next,
) => {
  const dependencies = await createRequestDependencies();
  const container = createRequestContainer(dependencies);

  c.set("requestId", dependencies.requestId);
  c.set("requestDependencies", dependencies);
  c.set("container", container);
  c.header("X-Request-Id", dependencies.requestId);

  await next();
};
