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

describe("SettingsTemplate", () => {
  it("显示我的页面标题、说明和设置入口", () => {
    const { container } = render(<SettingsTemplate />);

    expect(
      within(container).getByRole("heading", { name: "我的" }),
    ).toBeInTheDocument();
    expect(
      within(container).getByText("管理个人信息、主题与应用设置"),
    ).toBeInTheDocument();

    for (const label of [
      "个人主页",
      "主题换装",
      "账户管理",
      "分类管理",
      "标签管理",
      "商家管理",
      "语言设置",
      "数据导入导出",
      "App 偏好设置",
      "帮助与反馈",
      "关于 KuraNote",
    ]) {
      expect(
        within(container).getByRole("button", { name: new RegExp(label) }),
      ).toBeInTheDocument();
    }
  });

  it("语言设置入口显示当前语言", () => {
    const { container } = render(<SettingsTemplate />);

    expect(within(container).getByText("简体中文")).toBeInTheDocument();
  });

  it("点击入口时显示准备中提示", () => {
    const { container } = render(<SettingsTemplate />);

    fireEvent.click(
      within(container).getByRole("button", { name: /主题换装/ }),
    );

    expect(screen.getByText("正在准备中")).toBeInTheDocument();
  });
});
