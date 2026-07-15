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
import type { LedgerSettingsView } from "types/ledgers";

import { LedgerSettingsTemplate } from "./LedgerSettings";

const routerReplaceMock = vi.hoisted(() => vi.fn());
const inviteAction = vi.fn(async () => {});

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: routerReplaceMock }),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  window.localStorage.clear();
  document.documentElement.removeAttribute("data-user-theme");
  window.history.replaceState(null, "", "/");
});

function renderWithUserTheme(children: ReactNode) {
  return render(
    <UserThemeProvider storageScope="ledger-settings-template-test">
      {children}
    </UserThemeProvider>,
  );
}

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

describe("LedgerSettingsTemplate", () => {
  it("显示账本设置标题和当前使用状态", () => {
    const { container } = renderWithUserTheme(
      <LedgerSettingsTemplate
        {...view}
        errorMessage={null}
        inviteAction={inviteAction}
        updateLedgerSettingsAction={vi.fn(async () => {})}
      />,
    );

    expect(
      within(container).getByRole("heading", { name: "账本设置" }),
    ).toBeInTheDocument();
    expect(within(container).getByText("当前使用中")).toBeInTheDocument();
  });

  it("显示基础信息和成员列表，且不显示我的设置与危险操作", () => {
    const { container } = renderWithUserTheme(
      <LedgerSettingsTemplate
        {...view}
        errorMessage={null}
        inviteAction={inviteAction}
        updateLedgerSettingsAction={vi.fn(async () => {})}
      />,
    );

    expect(screen.getByLabelText("账本名称")).toHaveValue("家庭账本");
    expect(within(container).getByText("JPY 日元")).toBeInTheDocument();
    expect(within(container).getByText("DENG SONGWEN")).toBeInTheDocument();
    expect(within(container).getByText("配偶")).toBeInTheDocument();
    expect(within(container).queryByText("我的设置")).not.toBeInTheDocument();
    expect(within(container).queryByText("危险操作")).not.toBeInTheDocument();
  });

  it("点击成员后显示成员设置弹窗", () => {
    renderWithUserTheme(
      <LedgerSettingsTemplate
        {...view}
        errorMessage={null}
        inviteAction={inviteAction}
        updateLedgerSettingsAction={vi.fn(async () => {})}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /配偶/ }));

    expect(
      screen.getByRole("heading", { name: "成员设置" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("当前账本昵称")).toHaveValue("配偶");
    expect(screen.getByLabelText("粉樱")).toBeChecked();
    expect(screen.getByText("成员权限")).toBeInTheDocument();
  });

  it("普通成员打开其他成员设置时不能编辑个性色", () => {
    renderWithUserTheme(
      <LedgerSettingsTemplate
        {...view}
        canEditLedger={false}
        errorMessage={null}
        inviteAction={inviteAction}
        updateLedgerSettingsAction={vi.fn(async () => {})}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /配偶/ }));

    expect(screen.getByLabelText("粉樱")).toBeDisabled();
    expect(
      screen
        .getAllByRole("button", { name: "保存修改" })
        .every((button) => button.hasAttribute("disabled")),
    ).toBe(true);
  });

  it("普通成员可以编辑自己的当前账本昵称和个性色，但不能编辑权限", () => {
    const memberView: LedgerSettingsView = {
      ...view,
      currentUser: {
        displayColor: "sakura",
        displayName: "配偶",
        userId: memberUserId,
      },
    };

    renderWithUserTheme(
      <LedgerSettingsTemplate
        {...memberView}
        canEditLedger={false}
        errorMessage={null}
        inviteAction={inviteAction}
        updateLedgerSettingsAction={vi.fn(async () => {})}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /配偶/ }));

    expect(screen.getByLabelText("当前账本昵称")).not.toBeDisabled();
    expect(screen.getByLabelText("粉樱")).not.toBeDisabled();
    expect(screen.getByLabelText("成员权限")).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    expect(
      screen
        .getAllByRole("button", { name: "保存修改" })
        .some((button) => !button.hasAttribute("disabled")),
    ).toBe(true);
  });

  it("保存按钮和取消按钮显示正确", () => {
    const action = vi.fn(async () => {});

    const { container } = renderWithUserTheme(
      <LedgerSettingsTemplate
        {...view}
        errorMessage={null}
        inviteAction={inviteAction}
        updateLedgerSettingsAction={action}
      />,
    );

    expect(
      within(container).getByRole("button", { name: "保存修改" }),
    ).toBeInTheDocument();
    expect(
      within(container).getByRole("link", { name: "取消" }),
    ).toHaveAttribute("href", "/ledgers");
  });

  it("传入错误信息时显示失败反馈", () => {
    renderWithUserTheme(
      <LedgerSettingsTemplate
        {...view}
        errorKey="error-key-1"
        errorMessage="账本设置保存失败。"
        inviteAction={inviteAction}
        updateLedgerSettingsAction={vi.fn(async () => {})}
      />,
    );

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("账本设置保存失败。")).toBeInTheDocument();
  });
});
