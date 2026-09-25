import type { ConflictError } from "internal/shared/errors/appError";
import { createConcurrentModificationError } from "internal/shared/errors/concurrentModification";
import type { Logger } from "internal/shared/logging/logger";

export type RpcErrorLike = {
  code?: string | null;
  details?: string | null;
  hint?: string | null;
  message?: string | null;
};

export function findRpcBusinessError<TErrorCode extends string>(
  error: RpcErrorLike | null,
  errorMap: Readonly<Record<string, TErrorCode>>,
): TErrorCode | null {
  const businessErrorCode = error?.details?.trim();

  return businessErrorCode ? (errorMap[businessErrorCode] ?? null) : null;
}

export function mapRpcBusinessError<TErrorCode extends string>(
  error: RpcErrorLike | null,
  errorMap: Readonly<Record<string, TErrorCode>>,
  fallback: TErrorCode,
): TErrorCode {
  return findRpcBusinessError(error, errorMap) ?? fallback;
}

/** PostgreSQL 死锁（40P01）与序列化失败（40001），重试即可成功。 */
const retryableConcurrencySqlStates: ReadonlySet<string> = new Set([
  "40P01",
  "40001",
]);

/** 只按 SQLSTATE（`error.code`）精确判断，不解析 message。 */
export function isRetryableConcurrencyError(
  error: RpcErrorLike | null | undefined,
): boolean {
  const code = error?.code;
  return typeof code === "string" && retryableConcurrencySqlStates.has(code);
}

/**
 * 可重试的并发冲突转换为统一的 ConflictError（409），并只记录 code 与 operation
 * 等安全字段；不是并发冲突时返回 null，由调用方继续按原有规则处理。
 * 调用方应先匹配更具体的业务 detail，未匹配时再调用本函数。
 */
export function toConcurrentModificationError(
  error: RpcErrorLike | null | undefined,
  logger: Logger,
  operation: string,
): ConflictError | null {
  if (!isRetryableConcurrencyError(error)) return null;

  logger.warn("[supabase] retryable concurrent modification", {
    code: error?.code ?? null,
    operation,
  });
  return createConcurrentModificationError();
}
