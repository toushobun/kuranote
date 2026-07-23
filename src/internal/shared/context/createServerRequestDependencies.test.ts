// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

vi.mock("internal/shared/context/requestDependencies", async () => {
  const actual = await vi.importActual<
    typeof import("internal/shared/context/requestDependencies")
  >("internal/shared/context/requestDependencies");
  return {
    ...actual,
    createRequestDependencies: vi.fn().mockResolvedValue({
      auth: { email: null, isAuthenticated: false, userId: null },
      logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
      requestId: "fixed-request-id",
      supabase: {},
    }),
  };
});

import { createServerRequestDependencies } from "internal/shared/context/createServerRequestDependencies";

describe("createServerRequestDependencies", () => {
  it("返回底层 createRequestDependencies 产出的依赖对象", async () => {
    const dependencies = await createServerRequestDependencies();

    expect(dependencies.requestId).toBe("fixed-request-id");
    expect(dependencies.auth).toEqual({
      email: null,
      isAuthenticated: false,
      userId: null,
    });
  });
});
