// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

import { loadSettingsProfileView } from "internal/user/adapter/next/loadSettingsProfileView";

const mocks = vi.hoisted(() => ({
  createRequestContainer: vi.fn(),
  createServerRequestDependencies: vi.fn(),
  getCurrentProfile: vi.fn(),
  listCurrentLedgerDisplayNames: vi.fn(),
}));

vi.mock("internal/container", () => ({
  createRequestContainer: mocks.createRequestContainer,
}));

vi.mock("internal/shared/context/createServerRequestDependencies", () => ({
  createServerRequestDependencies: mocks.createServerRequestDependencies,
}));

const profile = {
  avatarUrl: null,
  displayName: "淞文",
  email: "user@example.com",
  id: "00000000-0000-4000-8000-000000000031",
  status: "active",
  transactionColorScheme: "expense_green_income_red",
};
const ledgerDisplayNames = [
  {
    displayName: "爸爸",
    ledgerId: "00000000-0000-4000-8000-000000000101",
    ledgerName: "家庭",
  },
];

describe("loadSettingsProfileView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createServerRequestDependencies.mockResolvedValue({});
    mocks.createRequestContainer.mockReturnValue({
      user: {
        service: {
          getCurrentProfile: mocks.getCurrentProfile,
          listCurrentLedgerDisplayNames: mocks.listCurrentLedgerDisplayNames,
        },
      },
    });
    mocks.getCurrentProfile.mockResolvedValue(profile);
    mocks.listCurrentLedgerDisplayNames.mockResolvedValue(ledgerDisplayNames);
  });

  it("通过 RequestContainer 读取用户资料与账本昵称", async () => {
    await expect(loadSettingsProfileView()).resolves.toEqual({
      ledgerDisplayNames,
      profile,
    });
  });

  it("读取失败时把错误交给页面错误边界", async () => {
    const error = new Error("load failed");
    mocks.getCurrentProfile.mockRejectedValue(error);

    await expect(loadSettingsProfileView()).rejects.toBe(error);
  });
});
