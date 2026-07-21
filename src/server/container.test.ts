// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

import { createRequestContainer } from "server/container";
import type { RequestDependencies } from "server/shared/context/requestDependencies";

function createDependenciesStub(): RequestDependencies {
  return {
    auth: { email: null, isAuthenticated: false, userId: null },
    logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
    requestId: "req-1",
    // Repository 只在方法被调用时访问 Supabase，这里提供最小 stub。
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

  it("提供惰性缓存的 account.service 及账户 UseCase", () => {
    const container = createRequestContainer(createDependenciesStub());

    expect(container.account).toBe(container.account);
    expect(typeof container.account.service.getView).toBe("function");
    expect(typeof container.account.service.create).toBe("function");
    expect(typeof container.account.service.update).toBe("function");
    expect(typeof container.account.service.archive).toBe("function");
  });

  it("提供惰性缓存的 auth.service 及全部认证 UseCase", () => {
    const container = createRequestContainer(createDependenciesStub());

    expect(container.auth).toBe(container.auth);
    expect(typeof container.auth.service.login).toBe("function");
    expect(typeof container.auth.service.requestRegisterOtp).toBe("function");
    expect(typeof container.auth.service.submitRegisterOtp).toBe("function");
    expect(typeof container.auth.service.startGoogleAuth).toBe("function");
    expect(typeof container.auth.service.getSession).toBe("function");
    expect(typeof container.auth.service.logout).toBe("function");
  });

  it("提供惰性缓存的 Category 读取与写入 UseCase", () => {
    const container = createRequestContainer(createDependenciesStub());

    expect(container.category).toBe(container.category);
    expect(typeof container.category.service.getCategoriesView).toBe(
      "function",
    );
    expect(typeof container.category.service.create).toBe("function");
    expect(typeof container.category.service.update).toBe("function");
    expect(typeof container.category.service.archive).toBe("function");
    expect(typeof container.category.service.reorder).toBe("function");
  });

  it("提供惰性缓存的 user.service 和显示名同步窄接口", () => {
    const container = createRequestContainer(createDependenciesStub());

    expect(container.user).toBe(container.user);
    expect(typeof container.user.service.getCurrentProfile).toBe("function");
    expect(typeof container.user.service.updateCurrentProfile).toBe("function");
    expect(typeof container.user.service.syncDisplayName).toBe("function");
  });

  it("提供惰性缓存的 merchant.service 与跨模块窄查询接口", () => {
    const container = createRequestContainer(createDependenciesStub());

    expect(container.merchant).toBe(container.merchant);
    expect(typeof container.merchant.service.getView).toBe("function");
    expect(typeof container.merchant.service.list).toBe("function");
    expect(typeof container.merchant.service.listActiveOptions).toBe(
      "function",
    );
    expect(typeof container.merchant.service.findSummariesByIds).toBe(
      "function",
    );
  });
});
