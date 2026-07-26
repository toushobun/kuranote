// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

import { loadLedgerInvitePreview } from "internal/ledger/adapter/next/loadLedgerInvitePreview";

const mocks = vi.hoisted(() => ({
  createRequestContainer: vi.fn(),
  createServerRequestDependencies: vi.fn(),
  load: vi.fn(),
  loggerError: vi.fn(),
}));

vi.mock("internal/container", () => ({
  createRequestContainer: mocks.createRequestContainer,
}));

vi.mock("internal/shared/context/createServerRequestDependencies", () => ({
  createServerRequestDependencies: mocks.createServerRequestDependencies,
}));

vi.mock("internal/shared/logging/logger", () => ({
  createLogger: vi.fn(() => ({
    error: mocks.loggerError,
    info: vi.fn(),
    warn: vi.fn(),
  })),
}));

describe("loadLedgerInvitePreview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createServerRequestDependencies.mockResolvedValue({});
    mocks.createRequestContainer.mockReturnValue({
      ledger: { invitePreviewService: { load: mocks.load } },
    });
  });

  it("通过 RequestContainer 加载邀请预览", async () => {
    const preview = {
      inviteRole: "member",
      inviterName: "管理员",
      ledgerName: "家庭账本",
      status: "valid",
    } as const;
    mocks.load.mockResolvedValue(preview);

    await expect(loadLedgerInvitePreview("token")).resolves.toEqual(preview);

    expect(mocks.createServerRequestDependencies).toHaveBeenCalledTimes(1);
    expect(mocks.createRequestContainer).toHaveBeenCalledWith({});
    expect(mocks.load).toHaveBeenCalledWith("token");
  });

  it("容器加载失败时返回失效预览并记录安全错误名", async () => {
    mocks.createServerRequestDependencies.mockRejectedValue(
      new Error("database secret"),
    );

    await expect(loadLedgerInvitePreview("token")).resolves.toEqual({
      inviteRole: null,
      inviterName: null,
      ledgerName: null,
      status: "invalid",
    });
    expect(mocks.loggerError).toHaveBeenCalledWith(
      "[ledgerInvite] failed to load invite preview",
      { errorName: "Error" },
    );
    expect(mocks.loggerError).not.toHaveBeenCalledWith(
      expect.stringContaining("database secret"),
    );
  });
});
