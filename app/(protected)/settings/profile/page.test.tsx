// @vitest-environment node

import type { ReactElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  changePassword: vi.fn(),
  getCurrentLedgerContext: vi.fn(),
  loadGoogleIdentityLinkView: vi.fn(),
  loadSettingsProfileView: vi.fn(),
  logout: vi.fn(),
  requestPasswordChangeOtp: vi.fn(),
  startGoogleIdentityLink: vi.fn(),
  unlinkGoogleIdentity: vi.fn(),
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
  changePassword: mocks.changePassword,
  logout: mocks.logout,
  requestPasswordChangeOtp: mocks.requestPasswordChangeOtp,
  startGoogleIdentityLink: mocks.startGoogleIdentityLink,
  unlinkGoogleIdentity: mocks.unlinkGoogleIdentity,
}));
vi.mock("internal/auth/adapter/next/loadGoogleIdentityLinkView", () => ({
  loadGoogleIdentityLinkView: mocks.loadGoogleIdentityLinkView,
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
const googleIdentity = { linked: false };

function renderRoute(searchParams: { linkResult?: string | string[] } = {}) {
  return SettingsProfileRoute({
    searchParams: Promise.resolve(searchParams),
  }) as Promise<ReactElement>;
}

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
    mocks.loadGoogleIdentityLinkView.mockResolvedValue({
      googleIdentity,
      linkFeedback: null,
    });
  });

  it("把用户资料、账本昵称、当前账本、绑定状态与 Action 传给模板", async () => {
    const result = await renderRoute();

    expect(result.props).toMatchObject({
      changePasswordAction: mocks.changePassword,
      currentLedgerId: ledgerId,
      googleIdentity,
      googleIdentityLinkFeedback: null,
      ledgers: ledgerDisplayNames,
      linkGoogleIdentityAction: mocks.startGoogleIdentityLink,
      logoutAction: mocks.logout,
      profile,
      requestPasswordChangeOtpAction: mocks.requestPasswordChangeOtp,
      unlinkGoogleIdentityAction: mocks.unlinkGoogleIdentity,
      updateAvatarAction: mocks.updateAvatar,
      updateDisplayNameAction: mocks.updateDisplayName,
    });
  });

  it("只把字符串形式的 linkResult 交给绑定状态 loader", async () => {
    await renderRoute({ linkResult: "linked" });
    expect(mocks.loadGoogleIdentityLinkView).toHaveBeenLastCalledWith("linked");

    await renderRoute({ linkResult: ["linked", "failed"] });
    expect(mocks.loadGoogleIdentityLinkView).toHaveBeenLastCalledWith(
      undefined,
    );
  });

  it("没有当前账本时不默认勾选任何账本", async () => {
    mocks.getCurrentLedgerContext.mockResolvedValue({ currentLedger: null });

    const result = await renderRoute();

    expect(result.props).toMatchObject({ currentLedgerId: null });
  });
});
