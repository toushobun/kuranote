import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { UserThemeProvider } from "theme/UserThemeProvider";
import {
  familyLedgerId,
  profileFixture,
  profileLedgerDisplayNames,
} from "test/userProfileFixtures";

import { SettingsProfileTemplate } from "./SettingsProfile";

const logoutAction = vi.fn();
const updateAvatarAction = vi.fn(async () => ({}));
const updateDisplayNameAction = vi.fn(async () => ({}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function renderSettingsProfileTemplate() {
  return render(
    <UserThemeProvider storageScope="settings-profile-test">
      <SettingsProfileTemplate
        currentLedgerId={familyLedgerId}
        ledgers={profileLedgerDisplayNames}
        logoutAction={logoutAction}
        profile={profileFixture}
        updateAvatarAction={updateAvatarAction}
        updateDisplayNameAction={updateDisplayNameAction}
      />
    </UserThemeProvider>,
  );
}

function getEntryLabels(section: HTMLElement) {
  return Array.from(
    section.querySelectorAll("a, button"),
    (entry) => entry.textContent,
  );
}

describe("SettingsProfileTemplate", () => {
  it("显示标题、返回设置入口，以及昵称、邮箱和头像占位", () => {
    const { container } = renderSettingsProfileTemplate();

    expect(
      within(container).getByRole("heading", { name: "个人主页" }),
    ).toBeInTheDocument();
    expect(
      within(container).getByRole("link", { name: "返回设置" }),
    ).toHaveAttribute("href", "/settings");

    const summary = within(container).getByRole("region", { name: "账号信息" });
    expect(
      within(summary).getByRole("heading", { name: "淞文" }),
    ).toBeInTheDocument();
    expect(within(summary).getByText("user@example.com")).toBeInTheDocument();
    expect(within(summary).getByText("淞")).toBeInTheDocument();
    expect(
      within(summary).getByRole("button", { name: "更换头像" }),
    ).toBeInTheDocument();
  });

  it("按个人资料、账号安全、账号操作分组显示入口", () => {
    const { container } = renderSettingsProfileTemplate();

    expect(
      getEntryLabels(
        within(container).getByRole("region", { name: "个人资料" }),
      ),
    ).toEqual(["修改昵称淞文"]);
    expect(
      getEntryLabels(
        within(container).getByRole("region", { name: "账号安全" }),
      ),
    ).toEqual(["修改密码", "账号绑定"]);
    expect(
      getEntryLabels(
        within(container).getByRole("region", { name: "账号操作" }),
      ),
    ).toEqual(["退出登录"]);
  });

  it("修改密码与账号绑定显示准备中提示", () => {
    const { container } = renderSettingsProfileTemplate();

    fireEvent.click(
      within(container).getByRole("button", { name: /修改密码/ }),
    );

    expect(screen.getByText("正在准备中")).toBeInTheDocument();
  });

  it("点击修改昵称打开修改昵称弹框", () => {
    const { container } = renderSettingsProfileTemplate();

    fireEvent.click(
      within(container).getByRole("button", { name: /修改昵称/ }),
    );

    expect(
      screen.getByRole("dialog", { name: "修改昵称" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "昵称" })).toHaveValue("淞文");
  });

  it("退出登录作为表单提交按钮", () => {
    const { container } = renderSettingsProfileTemplate();

    const logoutButton = within(container).getByRole("button", {
      name: /退出登录/,
    });

    expect(logoutButton).toHaveAttribute("type", "submit");
    expect(logoutButton.closest("form")).not.toBeNull();
  });
});
