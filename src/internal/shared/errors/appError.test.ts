// @vitest-environment node

import { describe, expect, it } from "vitest";

import {
  AppError,
  AuthenticationError,
  NotFoundError,
} from "internal/shared/errors/appError";

describe("AppError", () => {
  it("携带 code、message 和可选 details", () => {
    const error = new AppError("some_error", "发生错误", {
      details: { field: "x" },
    });

    expect(error.code).toBe("some_error");
    expect(error.message).toBe("发生错误");
    expect(error.details).toEqual({ field: "x" });
  });

  it("子类保留各自的 name 和 instanceof 关系", () => {
    const error = new NotFoundError("not_found", "未找到");

    expect(error).toBeInstanceOf(AppError);
    expect(error).toBeInstanceOf(NotFoundError);
    expect(error).not.toBeInstanceOf(AuthenticationError);
    expect(error.name).toBe("NotFoundError");
  });
});
