// @vitest-environment node

import type { ReactElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createRequestContainer: vi.fn(),
  createServerRequestDependencies: vi.fn(),
  getCurrentLedgerContext: vi.fn(),
  getCurrentProfile: vi.fn(),
  ProtectedLayoutShell: vi.fn(() => null),
}));

vi.mock("internal/container", () => ({
  createRequestContainer: mocks.createRequestContainer,
}));
vi.mock("internal/ledger/adapter/next/currentLedger", () => ({
  getCurrentLedgerContext: mocks.getCurrentLedgerContext,
}));
vi.mock("internal/shared/context/createServerRequestDependencies", () => ({
  createServerRequestDependencies: mocks.createServerRequestDependencies,
}));
vi.mock("templates/protected/ProtectedLayoutShell", () => ({
  ProtectedLayoutShell: mocks.ProtectedLayoutShell,
}));

import ProtectedLayout from "./layout";

describe("ProtectedLayout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createServerRequestDependencies.mockResolvedValue({});
    mocks.getCurrentLedgerContext.mockResolvedValue({
      currentLedger: { currentUserRole: "owner" },
      email: "user@example.com",
    });
    mocks.getCurrentProfile.mockResolvedValue({
      transactionColorScheme: "expense_red_income_green",
    });
    mocks.createRequestContainer.mockReturnValue({
      user: { service: { getCurrentProfile: mocks.getCurrentProfile } },
    });
  });

  it("从 User Service 读取配色偏好并注入应用外壳", async () => {
    const result = (await ProtectedLayout({
      children: <div>内容</div>,
    })) as ReactElement<Record<string, unknown>>;

    expect(mocks.createServerRequestDependencies).toHaveBeenCalledOnce();
    expect(mocks.getCurrentProfile).toHaveBeenCalledOnce();
    expect(result.type).toBe(mocks.ProtectedLayoutShell);
    expect(result.props).toMatchObject({
      canWriteTransactions: true,
      email: "user@example.com",
      transactionColorScheme: "expense_red_income_green",
    });
  });
});
