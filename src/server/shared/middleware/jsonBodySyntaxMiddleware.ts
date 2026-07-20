import type { MiddlewareHandler } from "hono";

import type { AppEnv } from "server/appEnv";
import { ValidationError } from "server/shared/errors/appError";

function hasJsonContentType(contentType: string | undefined): boolean {
  if (!contentType) return false;

  const normalized = contentType.toLowerCase();
  return (
    normalized === "application/json" ||
    normalized.startsWith("application/json;") ||
    normalized.includes("+json")
  );
}

/**
 * 在进入 OpenAPI validator / Controller 前解析并缓存实际存在的 JSON body。
 * 这样只有请求体解析失败会被映射为 400；业务代码内部抛出的 SyntaxError
 * 仍由统一异常处理视为服务端 500，避免把内部故障伪装成客户端参数错误。
 */
export const jsonBodySyntaxMiddleware: MiddlewareHandler<AppEnv> = async (
  c,
  next,
) => {
  if (
    c.req.method === "GET" ||
    c.req.method === "HEAD" ||
    c.req.raw.body === null ||
    !hasJsonContentType(c.req.header("content-type"))
  ) {
    await next();
    return;
  }

  try {
    await c.req.json();
  } catch {
    throw new ValidationError("validation_error", "请求参数无效。");
  }

  await next();
};
