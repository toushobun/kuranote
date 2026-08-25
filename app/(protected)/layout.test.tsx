// @vitest-environment node

import type { ReactElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCurrentLedgerContext: vi.fn(),
  ProtectedLayoutShell: vi.fn(() => null),
}));

vi.mock("internal/ledger/adapter/next/currentLedger", () => ({
  getCurrentLedgerContext: mocks.getCurrentLedgerContext,
}));
vi.mock("templates/protected/ProtectedLayoutShell", () => ({
  ProtectedLayoutShell: mocks.ProtectedLayoutShell,
}));

import ProtectedLayout from "./layout";

describe("ProtectedLayout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getCurrentLedgerContext.mockResolvedValue({
      currentLedger: { currentUserRole: "owner" },
      email: "user@example.com",
      transactionColorScheme: "expense_red_income_green",
    });
  });

  it("复用当前账本上下文中的配色偏好并注入应用外壳", async () => {
    const result = (await ProtectedLayout({
      children: <div>内容</div>,
    })) as ReactElement<Record<string, unknown>>;

    expect(mocks.getCurrentLedgerContext).toHaveBeenCalledOnce();
    expect(result.type).toBe(mocks.ProtectedLayoutShell);
    expect(result.props).toMatchObject({
      canWriteTransactions: true,
      email: "user@example.com",
      transactionColorScheme: "expense_red_income_green",
    });
  });

  it("上下文没有配色值时回退到新默认方案", async () => {
    mocks.getCurrentLedgerContext.mockResolvedValue({
      currentLedger: null,
      email: "user@example.com",
    });

    const result = (await ProtectedLayout({
      children: <div>内容</div>,
    })) as ReactElement<Record<string, unknown>>;

    expect(result.props.transactionColorScheme).toBe(
      "expense_green_income_red",
    );
  });
});
