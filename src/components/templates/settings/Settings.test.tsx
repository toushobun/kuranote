import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { SettingsTemplate } from "./Settings";

afterEach(() => {
  cleanup();
});

function renderSettingsTemplate() {
  return render(<SettingsTemplate currentLedgerName="家庭账本" />);
}

function getEntryLabels(section: HTMLElement) {
  return Array.from(
    section.querySelectorAll("a, button"),
    (entry) => entry.textContent,
  );
}

describe("SettingsTemplate", () => {
  it("显示我的页面标题和说明", () => {
    const { container } = renderSettingsTemplate();

    expect(
      within(container).getByRole("heading", { name: "我的" }),
    ).toBeInTheDocument();
    expect(
      within(container).getByText("管理个人信息、主题与应用设置"),
    ).toBeInTheDocument();
  });

  it("按个人、管理、应用 / 支持分组显示入口", () => {
    const { container } = renderSettingsTemplate();

    expect(
      getEntryLabels(within(container).getByRole("region", { name: "个人" })),
    ).toEqual(["个人主页", "账本管理家庭账本"]);
    expect(
      getEntryLabels(within(container).getByRole("region", { name: "管理" })),
    ).toEqual(["账户管理", "分类管理", "商家管理", "数据导入导出"]);
    expect(
      getEntryLabels(
        within(container).getByRole("region", { name: "应用 / 支持" }),
      ),
    ).toEqual(["App 偏好设置", "帮助与反馈", "关于 KuraNote"]);
  });

  it("个人主页、管理类入口与 App 偏好设置跳转到对应页面", () => {
    const { container } = renderSettingsTemplate();

    for (const [label, href] of [
      ["个人主页", "/settings/profile"],
      ["账本管理", "/ledgers"],
      ["账户管理", "/accounts"],
      ["分类管理", "/categories"],
      ["商家管理", "/merchants"],
      ["数据导入导出", "/settings/data"],
      ["App 偏好设置", "/settings/preferences"],
    ] as const) {
      expect(
        within(container).getByRole("link", { name: new RegExp(label) }),
      ).toHaveAttribute("href", href);
    }
  });

  it("不再显示主题换装、收支颜色和语言设置入口", () => {
    const { container } = renderSettingsTemplate();

    for (const label of ["主题换装", "收支颜色", "语言设置"]) {
      expect(within(container).queryByText(label)).not.toBeInTheDocument();
    }
  });

  it("账本管理入口显示当前账本名称", () => {
    const { container } = renderSettingsTemplate();

    expect(within(container).getByText("家庭账本")).toBeInTheDocument();
  });

  it("点击未实现入口时显示准备中提示", () => {
    const { container } = renderSettingsTemplate();

    fireEvent.click(
      within(container).getByRole("button", { name: /帮助与反馈/ }),
    );

    expect(screen.getByText("正在准备中")).toBeInTheDocument();
  });

  it("我的页面不再显示退出登录入口", () => {
    const { container } = renderSettingsTemplate();

    expect(within(container).queryByText("退出登录")).not.toBeInTheDocument();
    expect(container.querySelector("form")).toBeNull();
  });
});
