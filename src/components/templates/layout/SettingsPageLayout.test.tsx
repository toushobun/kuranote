import Button from "@mui/material/Button";
import { cleanup, render, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { SettingsPageLayout } from "./SettingsPageLayout";

afterEach(() => {
  cleanup();
});

describe("SettingsPageLayout", () => {
  it("显示标题、副标题与内容", () => {
    const { container } = render(
      <SettingsPageLayout subtitle="页面说明" title="账户管理">
        <p>页面内容</p>
      </SettingsPageLayout>,
    );

    expect(
      within(container).getByRole("heading", { name: "账户管理" }),
    ).toBeInTheDocument();
    expect(within(container).getByText("页面说明")).toBeInTheDocument();
    expect(within(container).getByText("页面内容")).toBeInTheDocument();
  });

  it("传入 back 时显示指向返回地址的返回链接", () => {
    const { container } = render(
      <SettingsPageLayout
        back={{ href: "/settings", label: "返回设置" }}
        title="账户管理"
      >
        <p>页面内容</p>
      </SettingsPageLayout>,
    );

    expect(
      within(container).getByRole("link", { name: "返回设置" }),
    ).toHaveAttribute("href", "/settings");
  });

  it("未传入 back 时不显示返回链接", () => {
    const { container } = render(
      <SettingsPageLayout title="我的">
        <p>页面内容</p>
      </SettingsPageLayout>,
    );

    expect(within(container).queryByRole("link")).not.toBeInTheDocument();
  });

  it("显示头部操作区域", () => {
    const { container } = render(
      <SettingsPageLayout action={<Button>新增账户</Button>} title="账户管理">
        <p>页面内容</p>
      </SettingsPageLayout>,
    );

    expect(
      within(container).getByRole("button", { name: "新增账户" }),
    ).toBeInTheDocument();
  });

  it("铺设全屏页面背景并使用统一的内容宽度", () => {
    const { container } = render(
      <SettingsPageLayout title="账户管理">
        <p>页面内容</p>
      </SettingsPageLayout>,
    );

    expect(
      within(container).getByTestId("settings-page-background"),
    ).toHaveStyle({
      background: "var(--user-theme-page-bg)",
      inset: "0",
      position: "fixed",
    });
    expect(within(container).getByRole("main")).toHaveClass(
      "MuiContainer-maxWidthXs",
    );
  });
});
