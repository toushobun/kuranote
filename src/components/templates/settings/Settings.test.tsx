import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SettingsTemplate } from "./Settings";

vi.mock("molecules/theme/UserThemePicker", () => ({
  UserThemePicker: () => <div>主题选择器</div>,
}));
vi.mock(
  "molecules/theme/TransactionColorSchemePicker/TransactionColorSchemePicker",
  () => ({
    TransactionColorSchemePicker: () => <div>收支颜色选择器</div>,
  }),
);

const logoutAction = vi.fn();
const updateTransactionColorSchemeAction = vi.fn();

afterEach(() => {
  cleanup();
  logoutAction.mockClear();
  updateTransactionColorSchemeAction.mockClear();
});

function renderSettingsTemplate() {
  return render(
    <SettingsTemplate
      currentLedgerName="家庭账本"
      logoutAction={logoutAction}
      updateTransactionColorSchemeAction={updateTransactionColorSchemeAction}
    />,
  );
}

describe("SettingsTemplate", () => {
  it("显示我的页面标题、说明和设置入口", () => {
    const { container } = renderSettingsTemplate();

    expect(
      within(container).getByRole("heading", { name: "我的" }),
    ).toBeInTheDocument();
    expect(
      within(container).getByText("管理个人信息、主题与应用设置"),
    ).toBeInTheDocument();

    for (const label of [
      "个人主页",
      "主题换装",
      "收支颜色",
      "商家管理",
      "语言设置",
      "数据导入导出",
      "App 偏好设置",
      "帮助与反馈",
      "关于 KuraNote",
      "退出登录",
    ]) {
      expect(
        within(container).getByRole("button", { name: new RegExp(label) }),
      ).toBeInTheDocument();
    }

    expect(
      within(container).getByRole("link", { name: /账本管理/ }),
    ).toHaveAttribute("href", "/ledgers");
    expect(
      within(container).getByRole("link", { name: /账户管理/ }),
    ).toHaveAttribute("href", "/accounts");
    expect(
      within(container).getByRole("link", { name: /分类管理/ }),
    ).toHaveAttribute("href", "/categories");
  });

  it("账本管理入口显示当前账本名称", () => {
    const { container } = renderSettingsTemplate();

    expect(within(container).getByText("家庭账本")).toBeInTheDocument();
  });

  it("语言设置入口显示当前语言", () => {
    const { container } = renderSettingsTemplate();

    expect(within(container).getByText("简体中文")).toBeInTheDocument();
  });

  it("点击未实现入口时显示准备中提示", () => {
    const { container } = renderSettingsTemplate();

    fireEvent.click(
      within(container).getByRole("button", { name: /商家管理/ }),
    );

    expect(screen.getByText("正在准备中")).toBeInTheDocument();
  });

  it("点击主题换装时显示主题选择器", () => {
    const { container } = renderSettingsTemplate();

    fireEvent.click(
      within(container).getByRole("button", { name: /主题换装/ }),
    );

    expect(screen.getByText("主题选择器")).toBeInTheDocument();
    expect(screen.queryByText("正在准备中")).not.toBeInTheDocument();
  });

  it("收支颜色入口位于主题换装与账本管理之间并可展开", () => {
    const { container } = renderSettingsTemplate();
    const themeEntry = within(container).getByRole("button", {
      name: /主题换装/,
    });
    const colorEntry = within(container).getByRole("button", {
      name: /收支颜色/,
    });
    const ledgerEntry = within(container).getByRole("link", {
      name: /账本管理/,
    });

    expect(
      themeEntry.compareDocumentPosition(colorEntry) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      colorEntry.compareDocumentPosition(ledgerEntry) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    fireEvent.click(colorEntry);

    expect(screen.getByText("收支颜色选择器")).toBeInTheDocument();
  });

  it("展开一个选择器时收起另一个选择器", () => {
    const { container } = renderSettingsTemplate();
    const themeEntry = within(container).getByRole("button", {
      name: /主题换装/,
    });
    const colorEntry = within(container).getByRole("button", {
      name: /收支颜色/,
    });

    fireEvent.click(themeEntry);
    expect(themeEntry).toHaveAttribute("aria-expanded", "true");

    fireEvent.click(colorEntry);
    expect(themeEntry).toHaveAttribute("aria-expanded", "false");
    expect(colorEntry).toHaveAttribute("aria-expanded", "true");
  });
});
