// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

import { createRequestContainer } from "server/container";
import type { RequestDependencies } from "server/shared/context/requestDependencies";

function createDependenciesStub(): RequestDependencies {
  return {
    auth: { email: null, isAuthenticated: false, userId: null },
    logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
    requestId: "req-1",
    // Repository 只使用 supabase.rpc，这里提供最小可用的 stub。
    supabase: { rpc: vi.fn() } as never,
  };
}

describe("createRequestContainer", () => {
  it("同一个 container 实例重复访问同一模块字段返回同一对象（惰性缓存）", () => {
    const container = createRequestContainer(createDependenciesStub());

    const first = container.ledger;
    const second = container.ledger;

    expect(first).toBe(second);
  });

  it("提供 ledger.inviteService.accept 方法", () => {
    const container = createRequestContainer(createDependenciesStub());

    expect(typeof container.ledger.inviteService.accept).toBe("function");
  });
});
