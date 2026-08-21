// @vitest-environment node

import { describe, expect, it } from "vitest";

import { findRpcErrorCode } from "internal/transaction/repository/rpcError";

describe("findRpcErrorCode", () => {
  const errorCodes = ["first_error", "second_error"] as const;

  it("去除 details 首尾空白后匹配白名单错误码", () => {
    expect(findRpcErrorCode("  second_error  ", errorCodes)).toBe(
      "second_error",
    );
  });

  it("details 为空或不在白名单时返回 null", () => {
    expect(findRpcErrorCode(null, errorCodes)).toBeNull();
    expect(findRpcErrorCode("unknown_error", errorCodes)).toBeNull();
  });
});
