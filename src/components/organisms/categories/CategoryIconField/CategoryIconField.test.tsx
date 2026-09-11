import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CategoryIconField } from "./CategoryIconField";

afterEach(() => {
  cleanup();
});

describe("CategoryIconField", () => {
  it("显示当前图标并提交隐藏字段", () => {
    const { container } = render(
      <CategoryIconField onChange={vi.fn()} value="🍜" />,
    );

    expect(screen.getByLabelText("当前分类图标：🍜")).toBeInTheDocument();
    expect(container.querySelector('input[name="iconName"]')).toHaveValue("🍜");
  });

  it("分组展示并确认选择 Emoji", () => {
    const onChange = vi.fn();
    render(<CategoryIconField onChange={onChange} value="🍜" />);

    fireEvent.click(screen.getByRole("button", { name: "选择图标" }));
    expect(screen.getByRole("dialog")).not.toHaveClass(
      "MuiDialog-paperFullScreen",
    );
    expect(screen.getByRole("dialog")).toHaveClass("MuiDialog-paperWidthXs");
    expect(screen.getByText("🍴")).toBeVisible();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "餐饮 15个图标" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "选择咖啡图标" })).toBeVisible();
    expect(screen.getByRole("button", { name: "选择面条图标" })).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "选择咖啡图标" }));
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "确定" }));

    expect(onChange).toHaveBeenCalledWith("☕");
  });

  it("取消选择时保留原图标", () => {
    const onChange = vi.fn();
    render(<CategoryIconField onChange={onChange} value="🍜" />);

    fireEvent.click(screen.getByRole("button", { name: "选择图标" }));
    fireEvent.click(screen.getByRole("button", { name: "选择汉堡图标" }));
    fireEvent.click(screen.getByRole("button", { name: "取消" }));

    expect(onChange).not.toHaveBeenCalled();
  });
});
