import { expect, type Mock } from "vitest";

import { ConflictError } from "internal/shared/errors/appError";
import {
  concurrentModificationErrorCode,
  concurrentModificationErrorMessage,
} from "internal/shared/errors/concurrentModification";

const rawMessage = "deadlock detected on relation ledger_placeholder_member";

/**
 * Repository 测试共用：未匹配业务 detail 的死锁 / 序列化失败。
 * 40001 同时覆盖「没有 detail」和「detail 不在该 Repository 映射中」两种形态。
 */
export const retryableConcurrencyRpcErrors = [
  ["40P01 死锁", { code: "40P01", details: null, message: rawMessage }],
  ["40001 序列化失败", { code: "40001", details: null, message: rawMessage }],
  [
    "40001 未映射 detail",
    { code: "40001", details: "unmapped_detail", message: rawMessage },
  ],
] as const;

/** 断言失败被转换为统一的可重试冲突，且日志只记录安全字段。 */
export function expectConcurrentModificationConflict(
  failure: unknown,
  warn: Mock,
  operation: string,
): void {
  expect(failure).toBeInstanceOf(ConflictError);
  expect(failure).toMatchObject({
    code: concurrentModificationErrorCode,
    message: concurrentModificationErrorMessage,
  });
  expect(JSON.stringify(failure)).not.toContain(rawMessage);
  expect(warn).toHaveBeenCalledWith(expect.any(String), {
    code: expect.stringMatching(/^40(P01|001)$/),
    operation,
  });
  expect(JSON.stringify(warn.mock.calls)).not.toContain(rawMessage);
}
