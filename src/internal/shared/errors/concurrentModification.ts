import { ConflictError } from "internal/shared/errors/appError";

/**
 * 并发修改冲突（死锁、序列化失败）的唯一权威定义。
 * 这类失败与业务规则无关，重试即可成功，统一以可重试的 409 返回。
 */
export const concurrentModificationErrorCode = "concurrent_modification";

export const concurrentModificationErrorMessage =
  "数据正在被其他操作修改，请稍后重试。";

export function createConcurrentModificationError(): ConflictError {
  return new ConflictError(
    concurrentModificationErrorCode,
    concurrentModificationErrorMessage,
  );
}
