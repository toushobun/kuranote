import type { MiddlewareHandler } from "hono";

import { isSameOriginRequest } from "server/http/sameOriginRequest";
import { AuthorizationError } from "server/shared/errors/appError";

/**
 * Cookie 认证的写请求需要同源校验，防止 CSRF。
 * 复用 PR #467 已建立的 isSameOriginRequest 判断逻辑。
 */
export const sameOriginMiddleware: MiddlewareHandler = async (c, next) => {
  if (!isSameOriginRequest(c.req.raw)) {
    throw new AuthorizationError("forbidden", "请求来源无效。");
  }

  await next();
};
