import type { MiddlewareHandler } from "hono";

import { isSameOriginRequest } from "server/shared/middleware/sameOriginRequest";
import { AuthorizationError } from "server/shared/errors/appError";

const safeMethods = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * Cookie 认证的写请求需要同源校验，防止 CSRF。
 * GET / HEAD / OPTIONS 等安全方法不要求 Origin，避免正常读取被误判为 403。
 * 复用 PR #467 已建立的 isSameOriginRequest 判断逻辑。
 */
export const sameOriginMiddleware: MiddlewareHandler = async (c, next) => {
  if (!safeMethods.has(c.req.method) && !isSameOriginRequest(c.req.raw)) {
    throw new AuthorizationError("forbidden", "请求来源无效。");
  }

  await next();
};
