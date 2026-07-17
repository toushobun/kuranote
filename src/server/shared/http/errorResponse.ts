import type { Context } from "hono";

import type { AppEnv } from "server/appEnv";
import {
  AppError,
  AuthenticationError,
  AuthorizationError,
  ConflictError,
  NotFoundError,
  RateLimitError,
  RepositoryError,
  ValidationError,
} from "server/shared/errors/appError";

export type ErrorResponseBody = {
  error: {
    code: string;
    message: string;
    status: number;
    details?: unknown;
    requestId?: string;
  };
};

/**
 * 应用错误到 HTTP 状态的映射。
 * Service 只抛出应用错误，不依赖 HTTP 状态码；状态码统一在这里决定。
 */
function statusForError(error: AppError): number {
  if (error instanceof ValidationError) return 400;
  if (error instanceof AuthenticationError) return 401;
  if (error instanceof AuthorizationError) return 403;
  if (error instanceof NotFoundError) return 404;
  if (error instanceof ConflictError) return 409;
  if (error instanceof RateLimitError) return 429;
  if (error instanceof RepositoryError) return 500;
  return 500;
}

export function appErrorToResponseBody(
  error: AppError,
  requestId?: string,
): { body: ErrorResponseBody; status: number } {
  const status = statusForError(error);

  return {
    body: {
      error: {
        code: error.code,
        message: error.message,
        status,
        ...(requestId ? { requestId } : {}),
      },
    },
    status,
  };
}

/**
 * Hono Master Router 的统一异常捕获。未知异常记录服务端日志，
 * 转换为安全的 500，不向客户端暴露内部堆栈或原始异常信息。
 */
export function errorHandlingMiddleware(
  error: Error,
  context: Context<AppEnv>,
) {
  const requestId = context.get("requestId") as string | undefined;

  if (error instanceof AppError) {
    const { body, status } = appErrorToResponseBody(error, requestId);
    return context.json(body, status as never);
  }

  const logger = context.get("requestDependencies")?.logger;
  const logUnhandledError = logger?.error ?? console.error;
  logUnhandledError("[server] unhandled error", {
    error,
    path: context.req.path,
    requestId,
  });

  const body: ErrorResponseBody = {
    error: {
      code: "internal_error",
      message: "服务器发生未知错误，请稍后重试。",
      status: 500,
      ...(requestId ? { requestId } : {}),
    },
  };

  return context.json(body, 500);
}
