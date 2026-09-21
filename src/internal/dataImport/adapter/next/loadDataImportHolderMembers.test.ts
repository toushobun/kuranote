// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

import { loadDataImportHolderMembers } from "internal/dataImport/adapter/next/loadDataImportHolderMembers";

const mocks = vi.hoisted(() => ({
  createExecutionService: vi.fn(),
  createRequestContainer: vi.fn(),
  createServerRequestDependencies: vi.fn(),
  listHolderMembers: vi.fn(),
  requireCurrentUserAndLedger: vi.fn(),
}));

vi.mock("internal/ledger/adapter/next/currentLedger", () => ({
  requireCurrentUserAndLedger: mocks.requireCurrentUserAndLedger,
}));
vi.mock("internal/shared/context/createServerRequestDependencies", () => ({
  createServerRequestDependencies: mocks.createServerRequestDependencies,
}));
vi.mock("internal/container", () => ({
  createRequestContainer: mocks.createRequestContainer,
}));

const ledgerId = "00000000-0000-4000-8000-000000000032";
const userId = "00000000-0000-4000-8000-000000000031";
const currentLedger = {
  baseCurrency: "JPY",
  id: ledgerId,
  name: "家庭账本",
  role: "owner" as const,
};

describe("loadDataImportHolderMembers", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.requireCurrentUserAndLedger.mockResolvedValue({
      currentLedger,
      userId,
    });
    mocks.createServerRequestDependencies.mockResolvedValue({});
    mocks.createRequestContainer.mockReturnValue({
      dataImport: { createExecutionService: mocks.createExecutionService },
    });
    mocks.createExecutionService.mockReturnValue({
      listHolderMembers: mocks.listHolderMembers,
    });
  });

  it("SSR 直接复用执行 Service 读取当前账本成员", async () => {
    const members = [{ displayName: "张三", userId }];
    mocks.listHolderMembers.mockResolvedValue(members);

    await expect(loadDataImportHolderMembers()).resolves.toEqual(members);

    expect(mocks.createExecutionService).toHaveBeenCalledWith(currentLedger);
    expect(mocks.listHolderMembers).toHaveBeenCalledWith({ ledgerId, userId });
  });

  it("登录或账本校验失败时不读取成员", async () => {
    mocks.requireCurrentUserAndLedger.mockRejectedValue(
      new Error("NEXT_REDIRECT:/login"),
    );

    await expect(loadDataImportHolderMembers()).rejects.toThrow(
      "NEXT_REDIRECT:/login",
    );
    expect(mocks.listHolderMembers).not.toHaveBeenCalled();
  });
});
