import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { EmojiIconField } from "./EmojiIconField";

describe("EmojiIconField", () => {
  it("按分组和关键词筛选并确认图标", () => {
    const onChange = vi.fn();
    render(
      <EmojiIconField
        fieldLabel="标签图标"
        groups={[{ id: "shop", label: "零售" }]}
        helperText="选择图标"
        inputName="icon"
        onChange={onChange}
        options={[
          { emoji: "🛒", groupId: "shop", keywords: ["采购"], label: "超市" },
          { emoji: "✈️", groupId: "travel", keywords: ["出行"], label: "旅行" },
        ]}
        searchPlaceholder="搜索"
        value="🛒"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "选择图标" }));
    fireEvent.change(screen.getByLabelText("搜索图标"), {
      target: { value: "出行" },
    });
    fireEvent.click(screen.getByRole("button", { name: "选择旅行图标" }));
    fireEvent.click(screen.getByRole("button", { name: "确定" }));
    expect(onChange).toHaveBeenCalledWith("✈️");
  });
});
