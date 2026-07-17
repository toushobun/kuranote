// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

vi.mock("server/shared/context/requestDependencies", async () => {
  const actual = await vi.importActual<
    typeof import("server/shared/context/requestDependencies")
  >("server/shared/context/requestDependencies");
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

import { createServerRequestDependencies } from "server/shared/context/createServerRequestDependencies";

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

  // 注意：React.cache() 的请求内去重依赖 React 在渲染 Server Component
  // 树时提供的调用帧，脱离真实渲染上下文（例如本文件所在的纯 Vitest 环境）
  // 调用两次会各自触发一次底层依赖创建，无法在这里验证去重效果。
  // 去重行为本身由 React.cache() 保证，实际效果需要在页面级 / e2e 测试中
  // 通过真实 Server Component 渲染验证。
});
