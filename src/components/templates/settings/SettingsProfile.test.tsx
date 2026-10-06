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
  unlinkedGoogleIdentity,
} from "test/userProfileFixtures";

import { SettingsProfileTemplate } from "./SettingsProfile";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
}));

const changePasswordAction = vi.fn(async () => ({}));
const linkGoogleIdentityAction = vi.fn(async () => ({}));
const logoutAction = vi.fn();
const requestPasswordChangeOtpAction = vi.fn(async () => ({}));
const unlinkGoogleIdentityAction = vi.fn(async () => ({}));
const updateAvatarAction = vi.fn(async () => ({}));
const updateDisplayNameAction = vi.fn(async () => ({}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function renderSettingsProfileTemplate() {
  return render(
    <UserThemeProvider>
      <SettingsProfileTemplate
        changePasswordAction={changePasswordAction}
        currentLedgerId={familyLedgerId}
        googleIdentity={unlinkedGoogleIdentity}
        googleIdentityLinkFeedback={null}
        ledgers={profileLedgerDisplayNames}
        linkGoogleIdentityAction={linkGoogleIdentityAction}
        logoutAction={logoutAction}
        profile={profileFixture}
        requestPasswordChangeOtpAction={requestPasswordChangeOtpAction}
        unlinkGoogleIdentityAction={unlinkGoogleIdentityAction}
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

  it("点击账号绑定展开 Google 绑定状态", () => {
    const { container } = renderSettingsProfileTemplate();

    fireEvent.click(
      within(container).getByRole("button", { name: /账号绑定/ }),
    );

    const security = within(container).getByRole("region", {
      name: "账号安全",
    });
    expect(within(security).getByText("Google")).toBeInTheDocument();
    expect(within(security).getByText("未绑定")).toBeInTheDocument();
    expect(
      within(security).getByRole("button", { name: "绑定" }),
    ).toBeInTheDocument();
  });

  it("点击修改密码打开修改密码弹框并显示登录邮箱", () => {
    const { container } = renderSettingsProfileTemplate();

    fireEvent.click(
      within(container).getByRole("button", { name: /修改密码/ }),
    );

    const dialog = screen.getByRole("dialog", { name: "修改密码" });
    expect(
      within(dialog).getByText(/「user@example\.com」/),
    ).toBeInTheDocument();
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
