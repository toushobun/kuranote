// @vitest-environment node

import type { ReactElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCurrentLedgerContext: vi.fn(),
  loadSettingsProfileView: vi.fn(),
  logout: vi.fn(),
  updateAvatar: vi.fn(),
  updateDisplayName: vi.fn(),
}));

vi.mock("internal/ledger/adapter/next/currentLedger", () => ({
  getCurrentLedgerContext: mocks.getCurrentLedgerContext,
}));
vi.mock("internal/user/adapter/next/loadSettingsProfileView", () => ({
  loadSettingsProfileView: mocks.loadSettingsProfileView,
}));
vi.mock("internal/auth/adapter/next/actions", () => ({
  logout: mocks.logout,
}));
vi.mock("internal/user/adapter/next/actions", () => ({
  updateAvatar: mocks.updateAvatar,
  updateDisplayName: mocks.updateDisplayName,
}));

import SettingsProfileRoute from "./page";

const ledgerId = "00000000-0000-4000-8000-000000000101";
const profile = {
  avatarUrl: null,
  displayName: "淞文",
  email: "user@example.com",
  id: "00000000-0000-4000-8000-000000000031",
  status: "active",
  transactionColorScheme: "expense_green_income_red",
};
const ledgerDisplayNames = [
  { displayName: "爸爸", ledgerId, ledgerName: "家庭账本" },
];

describe("SettingsProfileRoute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.loadSettingsProfileView.mockResolvedValue({
      ledgerDisplayNames,
      profile,
    });
    mocks.getCurrentLedgerContext.mockResolvedValue({
      currentLedger: { id: ledgerId },
    });
  });

  it("把用户资料、账本昵称、当前账本与 Action 传给模板", async () => {
    const result = (await SettingsProfileRoute()) as ReactElement;

    expect(result.props).toMatchObject({
      currentLedgerId: ledgerId,
      ledgers: ledgerDisplayNames,
      logoutAction: mocks.logout,
      profile,
      updateAvatarAction: mocks.updateAvatar,
      updateDisplayNameAction: mocks.updateDisplayName,
    });
  });

  it("没有当前账本时不默认勾选任何账本", async () => {
    mocks.getCurrentLedgerContext.mockResolvedValue({ currentLedger: null });

    const result = (await SettingsProfileRoute()) as ReactElement;

    expect(result.props).toMatchObject({ currentLedgerId: null });
  });
});
