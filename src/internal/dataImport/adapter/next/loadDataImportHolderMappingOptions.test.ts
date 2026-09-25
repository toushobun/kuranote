// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

import { loadDataImportHolderMappingOptions } from "internal/dataImport/adapter/next/loadDataImportHolderMappingOptions";

const mocks = vi.hoisted(() => ({
  createExecutionService: vi.fn(),
  createRequestContainer: vi.fn(),
  createServerRequestDependencies: vi.fn(),
  loadHolderMappingOptions: vi.fn(),
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
  currentUserRole: "owner" as const,
};

describe("loadDataImportHolderMappingOptions", () => {
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
      loadHolderMappingOptions: mocks.loadHolderMappingOptions,
    });
  });

  it("SSR 直接复用执行 Service 读取成员与待邀请成员，并返回是否可新建", async () => {
    const options = {
      members: [{ displayName: "张三", userId }],
      placeholders: [
        { displayName: "奶奶", id: "00000000-0000-4000-8000-000000000051" },
      ],
    };
    mocks.loadHolderMappingOptions.mockResolvedValue(options);

    await expect(loadDataImportHolderMappingOptions()).resolves.toEqual({
      ...options,
      canManageMembers: true,
    });

    expect(mocks.createExecutionService).toHaveBeenCalledWith(currentLedger);
    expect(mocks.loadHolderMappingOptions).toHaveBeenCalledWith({
      ledgerId,
      userId,
    });
  });

  it.each([
    ["admin", true],
    ["member", false],
    ["viewer", false],
  ] as const)("%s 的 canManageMembers 为 %s", async (role, expected) => {
    mocks.requireCurrentUserAndLedger.mockResolvedValue({
      currentLedger: { ...currentLedger, currentUserRole: role },
      userId,
    });
    mocks.loadHolderMappingOptions.mockResolvedValue({
      members: [],
      placeholders: [],
    });

    await expect(loadDataImportHolderMappingOptions()).resolves.toMatchObject({
      canManageMembers: expected,
    });
  });

  it("登录或账本校验失败时不读取映射候选", async () => {
    mocks.requireCurrentUserAndLedger.mockRejectedValue(
      new Error("NEXT_REDIRECT:/login"),
    );

    await expect(loadDataImportHolderMappingOptions()).rejects.toThrow(
      "NEXT_REDIRECT:/login",
    );
    expect(mocks.loadHolderMappingOptions).not.toHaveBeenCalled();
  });
});
