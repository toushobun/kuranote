import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { LedgerWithMemberCount } from "lib/ledger/current-ledger";
import type {
  CurrentLedgerActionState,
  CurrentLedgerStateAction,
} from "types/ledgers";

import { LedgersActionStateTemplate } from "./LedgersActionState";

const routerReplaceMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: routerReplaceMock }),
}));

const ledgers: LedgerWithMemberCount[] = [
  {
    id: "00000000-0000-4000-8000-000000000001",
    name: "家庭账本",
    baseCurrency: "JPY",
    currentUserRole: "owner",
    memberCount: 2,
  },
  {
    id: "00000000-0000-4000-8000-000000000002",
    name: "旅行账本",
    baseCurrency: "USD",
    currentUserRole: "admin",
    memberCount: 1,
  },
];

function renderTemplate(action: CurrentLedgerStateAction) {
  return render(
    <LedgersActionStateTemplate
      currentLedgerId="00000000-0000-4000-8000-000000000001"
      ledgers={ledgers}
      switchResult={null}
      updateCurrentLedgerAction={action}
    />,
  );
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  window.history.replaceState(null, "", "/ledgers");
});

describe("LedgersActionStateTemplate", () => {
  it("切换失败时在当前页显示反馈且 URL 保持干净", async () => {
    const action = vi.fn(
      async (
        _previousState: CurrentLedgerActionState,
        _formData: FormData,
      ): Promise<CurrentLedgerActionState> => ({
        error: "账本切换失败，请稍后重试。",
        errorKey: "switch-error-1",
      }),
    );
    renderTemplate(action);

    fireEvent.click(screen.getByRole("button", { name: "切换到旅行账本" }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("账本切换失败");
    expect(alert).toHaveTextContent("账本切换失败，请稍后重试。");
    expect(window.location.pathname).toBe("/ledgers");
    expect(window.location.search).toBe("");
    expect(action).toHaveBeenCalledTimes(1);
    const submittedFormData = action.mock.calls[0]?.[1];
    expect(submittedFormData).toBeInstanceOf(FormData);
    expect(submittedFormData?.get("ledgerId")).toBe(
      "00000000-0000-4000-8000-000000000002",
    );
  });

  it("相同错误使用新 errorKey 时可以再次显示", async () => {
    let errorCount = 0;
    const action = vi.fn(
      async (
        _previousState: CurrentLedgerActionState,
        _formData: FormData,
      ): Promise<CurrentLedgerActionState> => {
        errorCount += 1;
        return {
          error: "账本切换失败，请稍后重试。",
          errorKey: `switch-error-${errorCount}`,
        };
      },
    );
    renderTemplate(action);

    fireEvent.click(screen.getByRole("button", { name: "切换到旅行账本" }));
    const firstAlert = await screen.findByRole("alert");
    fireEvent.click(within(firstAlert).getByRole("button", { name: "关闭" }));
    await waitFor(() => {
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "切换到旅行账本" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "账本切换失败，请稍后重试。",
    );
    expect(action).toHaveBeenCalledTimes(2);
  });
});