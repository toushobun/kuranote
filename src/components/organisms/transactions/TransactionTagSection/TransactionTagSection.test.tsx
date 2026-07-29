import { fireEvent, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";

import { TransactionTagSection } from "./TransactionTagSection";

const tagsFieldRef = createRef<HTMLDivElement>();
const suggestedTagOptions = [
  { color: "#111111", id: "tag-1", name: "日常" },
  { color: null, id: "tag-2", name: "工作" },
  { color: null, id: "tag-3", name: "家庭" },
  { color: null, id: "tag-4", name: "不会显示" },
];

function renderSection(
  overrides: Partial<Parameters<typeof TransactionTagSection>[0]> = {},
) {
  const props: Parameters<typeof TransactionTagSection>[0] = {
    helperText: "",
    newTagName: "",
    onAddTag: vi.fn(),
    onNewTagNameChange: vi.fn(),
    onRemoveTag: vi.fn(),
    selectedTagNames: ["已选择"],
    suggestedTagOptions,
    tagsFieldRef,
    ...overrides,
  };

  render(<TransactionTagSection {...props} />);
  return props;
}

describe("TransactionTagSection", () => {
  it("删除已选标签并添加前三个建议标签", () => {
    const props = renderSection();
    const selectedChip = screen.getByText("已选择").closest(".MuiChip-root");
    const deleteIcon = selectedChip?.querySelector(".MuiChip-deleteIcon");
    if (!deleteIcon) throw new Error("未找到标签删除按钮");

    fireEvent.click(deleteIcon);
    expect(props.onRemoveTag).toHaveBeenCalledWith("已选择");

    expect(screen.getByText("日常")).toBeInTheDocument();
    expect(screen.getByText("工作")).toBeInTheDocument();
    expect(screen.getByText("家庭")).toBeInTheDocument();
    expect(screen.queryByText("不会显示")).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("工作"));
    expect(props.onAddTag).toHaveBeenCalledWith("工作");
  });

  it("打开输入框后通过 Enter 和确认按钮追加标签", () => {
    const props = renderSection({ newTagName: "旅行" });

    fireEvent.click(screen.getByRole("button", { name: "追加" }));
    const input = screen.getByRole("textbox", { name: "新增标签" });
    fireEvent.change(input, { target: { value: "旅行中" } });
    expect(props.onNewTagNameChange).toHaveBeenCalledWith("旅行中");

    fireEvent.keyDown(input, { key: "Enter" });
    expect(props.onAddTag).toHaveBeenCalledWith("旅行");

    fireEvent.click(screen.getByRole("button", { name: "追加" }));
    expect(props.onAddTag).toHaveBeenCalledTimes(2);
  });

  it("取消新增时关闭输入框并清空草稿", () => {
    const props = renderSection({ newTagName: "临时标签" });

    fireEvent.click(screen.getByRole("button", { name: "追加" }));
    fireEvent.click(screen.getByRole("button", { name: "取消添加标签" }));

    expect(props.onNewTagNameChange).toHaveBeenCalledWith("");
    expect(screen.queryByRole("textbox", { name: "新增标签" })).toBeNull();
  });

  it("显示标签字段错误", () => {
    renderSection({ fieldError: "标签数量超过上限。" });

    expect(screen.getByText("标签数量超过上限。")).toBeInTheDocument();
  });
});
