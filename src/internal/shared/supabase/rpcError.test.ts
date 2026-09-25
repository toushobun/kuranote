import { describe, expect, it, vi } from "vitest";

import { ConflictError } from "internal/shared/errors/appError";
import {
  concurrentModificationErrorCode,
  concurrentModificationErrorMessage,
} from "internal/shared/errors/concurrentModification";
import type { Logger } from "internal/shared/logging/logger";

import {
  findRpcBusinessError,
  isRetryableConcurrencyError,
  mapRpcBusinessError,
  toConcurrentModificationError,
} from "./rpcError";

const errorMap = {
  permission_denied: "permission_denied",
  role_invalid: "role_invalid",
} as const;

const fallback = "update_failed" as const;

describe("mapRpcBusinessError", () => {
  it("根据 details 中的业务错误码返回对应错误", () => {
    expect(
      mapRpcBusinessError(
        {
          code: "42501",
          details: "permission_denied",
          hint: null,
          message: "权限不足",
        },
        errorMap,
        fallback,
      ),
    ).toBe("permission_denied");
  });

  it("details 为未知错误码时返回 fallback", () => {
    expect(
      mapRpcBusinessError(
        {
          code: "22023",
          details: "unknown_error",
          hint: null,
          message: "role_invalid",
        },
        errorMap,
        fallback,
      ),
    ).toBe(fallback);
  });

  it("缺少 details 时不解析 message 并返回 fallback", () => {
    expect(
      mapRpcBusinessError(
        {
          code: "22023",
          details: null,
          hint: null,
          message: "permission_denied",
        },
        errorMap,
        fallback,
      ),
    ).toBe(fallback);
  });

  it("error 为空时返回 fallback", () => {
    expect(mapRpcBusinessError(null, errorMap, fallback)).toBe(fallback);
  });
});

describe("findRpcBusinessError", () => {
  it("只根据完全匹配的 details 识别业务错误", () => {
    expect(
      findRpcBusinessError(
        {
          details: "permission_denied",
          message: "permission_denied",
        },
        errorMap,
      ),
    ).toBe("permission_denied");
    expect(
      findRpcBusinessError(
        { details: "prefix permission_denied suffix" },
        errorMap,
      ),
    ).toBeNull();
    expect(
      findRpcBusinessError({ message: "permission_denied" }, errorMap),
    ).toBeNull();
  });

  it("匹配前去除 details 的前后空白", () => {
    expect(
      findRpcBusinessError({ details: "  permission_denied\n" }, errorMap),
    ).toBe("permission_denied");
  });
});

describe("isRetryableConcurrencyError", () => {
  it.each(["40P01", "40001"])("SQLSTATE %s 视为可重试并发冲突", (code) => {
    expect(isRetryableConcurrencyError({ code })).toBe(true);
  });

  it.each(["23505", "42501", "P0001", "40002", "40p01", "", null, undefined])(
    "SQLSTATE %s 不视为可重试并发冲突",
    (code) => {
      expect(isRetryableConcurrencyError({ code })).toBe(false);
    },
  );

  it("只看 code，不解析 message 或 details", () => {
    expect(
      isRetryableConcurrencyError({
        code: "23505",
        details: "account_holder_changed",
        message: "deadlock detected (40P01)",
      }),
    ).toBe(false);
  });

  it("error 为空时返回 false", () => {
    expect(isRetryableConcurrencyError(null)).toBe(false);
    expect(isRetryableConcurrencyError(undefined)).toBe(false);
  });
});

describe("toConcurrentModificationError", () => {
  function createLogger() {
    return { error: vi.fn(), info: vi.fn(), warn: vi.fn() } satisfies Logger;
  }

  it("可重试冲突转换为统一 ConflictError，日志只记录 code 与 operation", () => {
    const logger = createLogger();

    const error = toConcurrentModificationError(
      { code: "40P01", message: "deadlock detected on relation account" },
      logger,
      "accept_ledger_invite",
    );

    expect(error).toBeInstanceOf(ConflictError);
    expect(error).toMatchObject({
      code: concurrentModificationErrorCode,
      message: concurrentModificationErrorMessage,
    });
    expect(logger.warn).toHaveBeenCalledWith(expect.any(String), {
      code: "40P01",
      operation: "accept_ledger_invite",
    });
    expect(JSON.stringify(logger.warn.mock.calls)).not.toContain("deadlock");
  });

  it("不是并发冲突时返回 null 且不记录日志", () => {
    const logger = createLogger();

    expect(
      toConcurrentModificationError(
        { code: "23505" },
        logger,
        "accept_ledger_invite",
      ),
    ).toBeNull();
    expect(logger.warn).not.toHaveBeenCalled();
  });
});
