import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { type ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { UserThemeProvider } from "theme/UserThemeProvider";
import type {
  LedgerSettingsActionState,
  LedgerSettingsStateAction,
  LedgerSettingsView,
} from "types/ledgers";

import { LedgerSettingsActionStateTemplate } from "./LedgerSettingsActionState";

const routerReplaceMock = vi.hoisted(() => vi.fn());
const inviteAction = vi.fn(async () => ({}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: routerReplaceMock }),
}));

const ownerUserId = "00000000-0000-4000-8000-000000000031";
const memberUserId = "00000000-0000-4000-8000-000000000034";

const view: LedgerSettingsView = {
  canEditLedger: true,
  currentUser: {
    displayColor: "amber",
    displayName: "DENG SONGWEN",
    userId: ownerUserId,
  },
  ledger: {
    baseCurrency: "JPY",
    currentUserRole: "owner",
    id: "00000000-0000-4000-8000-000000000032",
    isCurrent: true,
    name: "家庭账本",
  },
  members: [
    {
      avatarUrl: null,
      displayColor: "amber",
      displayName: "DENG SONGWEN",
      email: "songwen@example.com",
      role: "owner",
      userId: ownerUserId,
    },
    {
      avatarUrl: null,
      displayColor: "sakura",
      displayName: "配偶",
      email: null,
      role: "member",
      userId: memberUserId,
    },
  ],
  pendingInvites: [],
};

function renderWithUserTheme(children: ReactNode) {
  return render(
    <UserThemeProvider storageScope="ledger-settings-action-state-test">
      {children}
    </UserThemeProvider>,
  );
}

function renderTemplate(action: LedgerSettingsStateAction) {
  return renderWithUserTheme(
    <LedgerSettingsActionStateTemplate
      {...view}
      inviteAction={inviteAction}
      saveResult={null}
      updateLedgerSettingsAction={action}
    />,
  );
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  window.localStorage.clear();
  document.documentElement.removeAttribute("data-user-theme");
  window.history.replaceState(
    null,
    "",
    "/ledgers/00000000-0000-4000-8000-000000000032/settings",
  );
});

describe("LedgerSettingsActionStateTemplate", () => {
  it("基础信息保存失败时显示反馈、保留输入且 URL 保持干净", async () => {
    const action = vi.fn(
      async (
        _previousState: LedgerSettingsActionState,
        _formData: FormData,
      ): Promise<LedgerSettingsActionState> => ({
        error: "账本设置保存失败。请确认内容后稍后重试。",
        errorKey: "settings-error-1",
      }),
    );
    renderTemplate(action);

    fireEvent.change(screen.getByLabelText("账本名称"), {
      target: { value: "旅行账本" },
    });
    fireEvent.click(screen.getByRole("button", { name: "保存修改" }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("账本设置保存失败");
    expect(alert).toHaveTextContent(
      "账本设置保存失败。请确认内容后稍后重试。",
    );
    expect(screen.getByLabelText("账本名称")).toHaveValue("旅行账本");
    expect(window.location.search).toBe("");
    expect(action).toHaveBeenCalledTimes(1);
    const submittedFormData = action.mock.calls[0]?.[1];
    expect(submittedFormData?.get("intent")).toBe("ledger");
    expect(submittedFormData?.get("ledgerName")).toBe("旅行账本");
  });

  it("成员设置保存失败时保持弹窗和用户输入", async () => {
    const action = vi.fn(
      async (
        _previousState: LedgerSettingsActionState,
        _formData: FormData,
      ): Promise<LedgerSettingsActionState> => ({
        error: "成员权限指定不正确。",
        errorKey: "member-error-1",
      }),
    );
    renderTemplate(action);

    fireEvent.click(screen.getByRole("button", { name: /配偶/ }));
    const dialog = screen.getByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText("当前账本昵称"), {
      target: { value: "秋爽" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "保存修改" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "成员权限指定不正确。",
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(within(screen.getByRole("dialog")).getByLabelText("当前账本昵称"))
      .toHaveValue("秋爽");
    const submittedFormData = action.mock.calls[0]?.[1];
    expect(submittedFormData?.get("intent")).toBe("member");
    expect(submittedFormData?.get("memberDisplayName")).toBe("秋爽");
  });
});
