import { describe, expect, it } from "vitest";

import { findRpcBusinessError, mapRpcBusinessError } from "./rpcError";

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
