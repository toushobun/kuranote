import { describe, expect, it } from "vitest";

import { errorResponse } from "./errorResponse";

describe("errorResponse", () => {
  it("返回与响应体一致的 HTTP 状态", async () => {
    const response = errorResponse("RESOURCE_NOT_FOUND", "资源不存在。", 404);

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "RESOURCE_NOT_FOUND",
        message: "资源不存在。",
        status: 404,
      },
    });
  });

  it("按需返回安全的 details 和 requestId", async () => {
    const response = errorResponse("VALIDATION_FAILED", "输入内容有误。", 422, {
      details: { field: "name" },
      requestId: "request-1",
    });

    await expect(response.json()).resolves.toEqual({
      error: {
        code: "VALIDATION_FAILED",
        details: { field: "name" },
        message: "输入内容有误。",
        requestId: "request-1",
        status: 422,
      },
    });
  });
});
