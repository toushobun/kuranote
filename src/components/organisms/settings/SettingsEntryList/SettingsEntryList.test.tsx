import PaletteOutlinedIcon from "@mui/icons-material/PaletteOutlined";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  SettingsComingSoonToast,
  SettingsEntryButton,
  SettingsEntryGroupCard,
  SettingsExpandableEntry,
} from "./SettingsEntryList";

afterEach(() => {
  cleanup();
});

describe("SettingsEntryGroupCard", () => {
  it("以分组名称作为区域名称显示条目", () => {
    render(
      <SettingsEntryGroupCard label="管理">
        <span>条目</span>
      </SettingsEntryGroupCard>,
    );

    expect(
      within(screen.getByRole("region", { name: "管理" })).getByText("条目"),
    ).toBeInTheDocument();
  });
});

describe("SettingsEntryButton", () => {
  it("传入 href 时渲染为链接并显示 trailing", () => {
    render(
      <SettingsEntryButton
        href="/ledgers"
        icon={PaletteOutlinedIcon}
        isLast
        label="账本管理"
        trailing="家庭账本"
      />,
    );

    const link = screen.getByRole("link", { name: /账本管理/ });

    expect(link).toHaveAttribute("href", "/ledgers");
    expect(within(link).getByText("家庭账本")).toBeInTheDocument();
  });

  it("未传入 href 时渲染为按钮并响应点击", () => {
    const onClick = vi.fn();

    render(
      <SettingsEntryButton
        icon={PaletteOutlinedIcon}
        isLast
        label="帮助与反馈"
        onClick={onClick}
      />,
    );

    const button = screen.getByRole("button", { name: /帮助与反馈/ });
    fireEvent.click(button);

    expect(onClick).toHaveBeenCalledOnce();
    expect(button).toHaveAttribute("type", "button");
    expect(button).not.toHaveAttribute("aria-expanded");
  });

  it("danger 样式不显示右侧箭头", () => {
    render(
      <SettingsEntryButton
        icon={PaletteOutlinedIcon}
        isLast
        label="退出登录"
        tone="danger"
        type="submit"
      />,
    );

    const button = screen.getByRole("button", { name: /退出登录/ });

    expect(button).toHaveAttribute("type", "submit");
    expect(button.querySelectorAll("svg")).toHaveLength(1);
  });
});

describe("SettingsExpandableEntry", () => {
  it("根据 expanded 显示或隐藏面板内容", () => {
    const onToggle = vi.fn();
    const { rerender } = render(
      <SettingsExpandableEntry
        expanded={false}
        icon={PaletteOutlinedIcon}
        isLast={false}
        label="主题换装"
        onToggle={onToggle}
      >
        <div>主题选择器</div>
      </SettingsExpandableEntry>,
    );

    const button = screen.getByRole("button", { name: /主题换装/ });

    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("主题选择器")).not.toBeInTheDocument();

    fireEvent.click(button);
    expect(onToggle).toHaveBeenCalledOnce();

    rerender(
      <SettingsExpandableEntry
        expanded
        icon={PaletteOutlinedIcon}
        isLast={false}
        label="主题换装"
        onToggle={onToggle}
      >
        <div>主题选择器</div>
      </SettingsExpandableEntry>,
    );

    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("主题选择器")).toBeInTheDocument();
  });
});

describe("SettingsComingSoonToast", () => {
  it("打开时显示准备中提示", () => {
    render(<SettingsComingSoonToast onClose={vi.fn()} open />);

    expect(screen.getByText("正在准备中")).toBeInTheDocument();
  });
});
