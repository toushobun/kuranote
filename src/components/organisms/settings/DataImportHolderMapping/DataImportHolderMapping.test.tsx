import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { ImportHolderMappingCandidate } from "internal/dataImport";
import { DataImportHolderMapping } from "./DataImportHolderMapping";

const members = [
  { displayName: "张三", userId: "user-1" },
  { displayName: "李四", userId: "user-2" },
];

const candidates: ImportHolderMappingCandidate[] = [
  { name: "小明", recordCount: 12, reason: "unmatched" },
  { name: "小红", recordCount: 1, reason: "unmatched" },
];

function renderMapping(
  props: Partial<Parameters<typeof DataImportHolderMapping>[0]> = {},
) {
  const onCancel = vi.fn();
  const onConfirm = vi.fn();
  render(
    <DataImportHolderMapping
      candidates={candidates}
      members={members}
      onCancel={onCancel}
      onConfirm={onConfirm}
      {...props}
    />,
  );
  return { onCancel, onConfirm };
}

function cardOf(name: string) {
  return within(screen.getByRole("group", { name: `「${name}」` }));
}

function selectMember(name: string, optionName: string) {
  fireEvent.mouseDown(cardOf(name).getByRole("combobox"));
  fireEvent.click(screen.getByRole("option", { name: optionName }));
}

describe("DataImportHolderMapping", () => {
  it("每个姓名一张卡片并显示涉及记录数", () => {
    renderMapping();

    expect(
      screen.getByText("文件里有 2 位持有人在账本中找不到唯一对应的成员"),
    ).toBeInTheDocument();
    expect(cardOf("小明").getByText("涉及 12 条记录")).toBeInTheDocument();
    expect(cardOf("小红").getByText("涉及 1 条记录")).toBeInTheDocument();
  });

  it("默认选中「无持有人」", () => {
    renderMapping();

    expect(cardOf("小明").getByRole("combobox")).toHaveTextContent("无持有人");
  });

  it("同名多成员的姓名显示歧义提示", () => {
    renderMapping({
      candidates: [{ name: "重名", recordCount: 2, reason: "ambiguous" }],
    });

    expect(
      cardOf("重名").getByText(/账本中有多位同名成员/),
    ).toBeInTheDocument();
  });

  it("下拉包含全部账本成员与「无持有人」", () => {
    renderMapping();

    fireEvent.mouseDown(cardOf("小明").getByRole("combobox"));

    expect(
      screen.getAllByRole("option").map((option) => option.textContent),
    ).toEqual(["无持有人", "张三", "李四"]);
  });

  it("同名成员的选项用邮箱区分", () => {
    renderMapping({
      candidates: [{ name: "重名", recordCount: 2, reason: "ambiguous" }],
      members: [
        { displayName: "重名", email: "a@example.com", userId: "user-3" },
        { displayName: "重名", email: "b@example.com", userId: "user-4" },
        { displayName: "李四", email: "c@example.com", userId: "user-2" },
      ],
    });

    fireEvent.mouseDown(cardOf("重名").getByRole("combobox"));

    expect(
      screen.getAllByRole("option").map((option) => option.textContent),
    ).toEqual([
      "无持有人",
      "重名（a@example.com）",
      "重名（b@example.com）",
      "李四",
    ]);
  });

  it("继续导入时提交每个姓名的映射，未选择的按无持有人", () => {
    const { onConfirm } = renderMapping();

    selectMember("小明", "张三");
    fireEvent.click(screen.getByRole("button", { name: "继续导入" }));

    expect(onConfirm).toHaveBeenCalledWith({ 小明: "user-1", 小红: null });
  });

  it("允许多个姓名映射到同一个成员", () => {
    const { onConfirm } = renderMapping();

    selectMember("小明", "李四");
    selectMember("小红", "李四");
    fireEvent.click(screen.getByRole("button", { name: "继续导入" }));

    expect(onConfirm).toHaveBeenCalledWith({
      小明: "user-2",
      小红: "user-2",
    });
  });

  it("点击取消导入时触发取消且不提交映射", () => {
    const { onCancel, onConfirm } = renderMapping();

    fireEvent.click(screen.getByRole("button", { name: "取消导入" }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("disabled 时两个按钮都禁用", () => {
    renderMapping({ disabled: true });

    expect(screen.getByRole("button", { name: "取消导入" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "继续导入" })).toBeDisabled();
  });
});
