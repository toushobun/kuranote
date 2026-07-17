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

  it("搜索并确认选择 Emoji", () => {
    const onChange = vi.fn();
    render(<CategoryIconField onChange={onChange} value="🍜" />);

    fireEvent.click(screen.getByRole("button", { name: "选择图标" }));
    fireEvent.change(screen.getByLabelText("搜索图标"), {
      target: { value: "咖啡" },
    });

    expect(screen.getByRole("button", { name: "选择咖啡图标" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "选择面条图标" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "选择咖啡图标" }));
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
