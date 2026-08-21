// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock(
  "internal/account/repository/accountRepository",
  async (importOriginal) => {
    const actual =
      await importOriginal<
        typeof import("internal/account/repository/accountRepository")
      >();
    return {
      ...actual,
      createSupabaseAccountRepository: vi.fn(
        actual.createSupabaseAccountRepository,
      ),
    };
  },
);

vi.mock("internal/account/service/accountService", async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import("internal/account/service/accountService")
    >();
  return {
    ...actual,
    createAccountService: vi.fn(actual.createAccountService),
  };
});

vi.mock(
  "internal/category/repository/categoryRepository",
  async (importOriginal) => {
    const actual =
      await importOriginal<
        typeof import("internal/category/repository/categoryRepository")
      >();
    return {
      ...actual,
      createSupabaseCategoryRepository: vi.fn(
        actual.createSupabaseCategoryRepository,
      ),
    };
  },
);

vi.mock("internal/category/service/categoryService", async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import("internal/category/service/categoryService")
    >();
  return {
    ...actual,
    createCategoryService: vi.fn(actual.createCategoryService),
  };
});

vi.mock(
  "internal/ledger/repository/ledgerSettingsRepository",
  async (importOriginal) => {
    const actual =
      await importOriginal<
        typeof import("internal/ledger/repository/ledgerSettingsRepository")
      >();
    return {
      ...actual,
      createSupabaseLedgerSettingsRepository: vi.fn(
        actual.createSupabaseLedgerSettingsRepository,
      ),
    };
  },
);

vi.mock(
  "internal/ledger/service/ledgerAccessService",
  async (importOriginal) => {
    const actual =
      await importOriginal<
        typeof import("internal/ledger/service/ledgerAccessService")
      >();
    return {
      ...actual,
      createLedgerAccessService: vi.fn(actual.createLedgerAccessService),
    };
  },
);

vi.mock(
  "internal/merchant/repository/merchantRepository",
  async (importOriginal) => {
    const actual =
      await importOriginal<
        typeof import("internal/merchant/repository/merchantRepository")
      >();
    return {
      ...actual,
      createSupabaseMerchantRepository: vi.fn(
        actual.createSupabaseMerchantRepository,
      ),
    };
  },
);

vi.mock("internal/merchant/service/merchantService", async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import("internal/merchant/service/merchantService")
    >();
  return {
    ...actual,
    createMerchantService: vi.fn(actual.createMerchantService),
  };
});

import { createSupabaseAccountRepository } from "internal/account/repository/accountRepository";
import { createAccountService } from "internal/account/service/accountService";
import { createSupabaseCategoryRepository } from "internal/category/repository/categoryRepository";
import { createCategoryService } from "internal/category/service/categoryService";
import { createRequestContainer } from "internal/container";
import { createSupabaseLedgerSettingsRepository } from "internal/ledger/repository/ledgerSettingsRepository";
import { createLedgerAccessService } from "internal/ledger/service/ledgerAccessService";
import { createSupabaseMerchantRepository } from "internal/merchant/repository/merchantRepository";
import { createMerchantService } from "internal/merchant/service/merchantService";
import type { RequestDependencies } from "internal/shared/context/requestDependencies";

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
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("同一个 container 实例重复访问同一模块字段返回同一对象（惰性缓存）", () => {
    const container = createRequestContainer(createDependenciesStub());

    const first = container.ledger;
    const second = container.ledger;

    expect(first).toBe(second);
  });

  it("提供已关联明细编辑 Service 的读取快照与原子更新能力", () => {
    const container = createRequestContainer(createDependenciesStub());

    expect(container.transaction).toBe(container.transaction);
    expect(
      typeof container.transaction.linkedTransactionItemService.getEditSnapshot,
    ).toBe("function");
    expect(
      typeof container.transaction.linkedTransactionItemService.update,
    ).toBe("function");
    expect(
      typeof container.transaction.linkedTransactionEditService.updateNormal,
    ).toBe("function");
    expect(typeof container.transaction.linkedTransactionEditService.void).toBe(
      "function",
    );
  });

  it("提供 ledger.inviteService.accept 方法", () => {
    const container = createRequestContainer(createDependenciesStub());

    expect(typeof container.ledger.inviteService.accept).toBe("function");
  });

  it("提供 ledger.invitePreviewService.load 方法", () => {
    const container = createRequestContainer(createDependenciesStub());

    expect(typeof container.ledger.invitePreviewService.load).toBe("function");
  });

  it("跨模块访问时只构造一次账本设置 Repository 与访问 Service", () => {
    const container = createRequestContainer(createDependenciesStub());

    void container.account;
    void container.statistics;

    expect(createSupabaseLedgerSettingsRepository).toHaveBeenCalledTimes(1);
    expect(createLedgerAccessService).toHaveBeenCalledTimes(1);
  });

  it("跨统计与交易模块共享叶子依赖但独立创建模块正式 Service", () => {
    const container = createRequestContainer(createDependenciesStub());

    void container.statistics;
    void container.transaction;
    void container.account;
    void container.category;
    void container.merchant;

    expect(createSupabaseAccountRepository).toHaveBeenCalledTimes(1);
    expect(createSupabaseCategoryRepository).toHaveBeenCalledTimes(1);
    expect(createSupabaseMerchantRepository).toHaveBeenCalledTimes(1);
    expect(createAccountService).toHaveBeenCalledTimes(2);
    expect(createCategoryService).toHaveBeenCalledTimes(2);
    expect(createMerchantService).toHaveBeenCalledTimes(2);
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

  it("提供惰性缓存的 statistics.service 与统计查询 UseCase", () => {
    const container = createRequestContainer(createDependenciesStub());

    expect(container.statistics).toBe(container.statistics);
    expect(typeof container.statistics.service.getDashboard).toBe("function");
    expect(typeof container.statistics.service.getMonthly).toBe("function");
  });
});
