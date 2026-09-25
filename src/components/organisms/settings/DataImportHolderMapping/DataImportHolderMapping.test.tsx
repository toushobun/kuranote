import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { placeholderMemberText } from "config/placeholderMemberText";
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

function openOptions(name: string) {
  fireEvent.mouseDown(cardOf(name).getByRole("combobox"));
  return screen.getAllByRole("option").map((option) => option.textContent);
}

function selectMember(name: string, optionName: string) {
  openOptions(name);
  fireEvent.click(screen.getByRole("option", { name: optionName }));
}

const placeholders = [
  { displayName: "外婆", id: "00000000-0000-4000-8000-000000000051" },
  { displayName: "奶奶", id: "00000000-0000-4000-8000-000000000052" },
];

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
    ).toEqual(["无持有人", "成员", "张三", "李四"]);
    expect(
      screen.queryByText(placeholderMemberText.accountHolderGroupLabel),
    ).not.toBeInTheDocument();
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
      "成员",
      "重名（a@example.com）",
      "重名（b@example.com）",
      "李四",
    ]);
  });

  it("继续导入时提交每个姓名的映射，未选择的按无持有人", () => {
    const { onConfirm } = renderMapping();

    selectMember("小明", "张三");
    fireEvent.click(screen.getByRole("button", { name: "继续导入" }));

    expect(onConfirm).toHaveBeenCalledWith({
      小明: { kind: "member", userId: "user-1" },
      小红: { kind: "none" },
    });
  });

  it("允许多个姓名映射到同一个成员", () => {
    const { onConfirm } = renderMapping();

    selectMember("小明", "李四");
    selectMember("小红", "李四");
    fireEvent.click(screen.getByRole("button", { name: "继续导入" }));

    expect(onConfirm).toHaveBeenCalledWith({
      小明: { kind: "member", userId: "user-2" },
      小红: { kind: "member", userId: "user-2" },
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

  describe("待邀请成员选项", () => {
    it("现有待邀请成员分组显示，文案与账户表单的「（待邀请）」一致", () => {
      renderMapping({ placeholders });

      expect(openOptions("小明")).toEqual([
        "无持有人",
        "成员",
        "张三",
        "李四",
        placeholderMemberText.accountHolderGroupLabel,
        "外婆（待邀请）",
        "奶奶（待邀请）",
      ]);
    });

    it("与文件姓名同名的待邀请成员排在最前，但默认仍是「无持有人」", () => {
      renderMapping({
        candidates: [{ name: "奶奶", recordCount: 1, reason: "unmatched" }],
        placeholders,
      });

      expect(cardOf("奶奶").getByRole("combobox")).toHaveTextContent(
        "无持有人",
      );
      expect(openOptions("奶奶").slice(5)).toEqual([
        "奶奶（待邀请）",
        "外婆（待邀请）",
      ]);
    });

    it("选择现有待邀请成员时按 ID 提交", () => {
      const { onConfirm } = renderMapping({ placeholders });

      selectMember("小明", "奶奶（待邀请）");
      fireEvent.click(screen.getByRole("button", { name: "继续导入" }));

      expect(onConfirm).toHaveBeenCalledWith({
        小明: { kind: "placeholder", placeholderId: placeholders[1].id },
        小红: { kind: "none" },
      });
    });
  });

  describe("新建待邀请成员", () => {
    it("管理员可以看到新建选项，选择后只在本地提交新建意图", () => {
      const { onCancel, onConfirm } = renderMapping({
        canCreatePlaceholders: true,
      });

      expect(
        screen.getByText(/点击「继续导入」时才会创建/),
      ).toBeInTheDocument();
      expect(openOptions("小明")).toEqual([
        "无持有人",
        "成员",
        "张三",
        "李四",
        placeholderMemberText.accountHolderGroupLabel,
        "新建待邀请成员「小明」",
      ]);
      fireEvent.click(
        screen.getByRole("option", { name: "新建待邀请成员「小明」" }),
      );
      expect(onConfirm).not.toHaveBeenCalled();
      expect(onCancel).not.toHaveBeenCalled();

      fireEvent.click(screen.getByRole("button", { name: "继续导入" }));

      expect(onConfirm).toHaveBeenCalledWith({
        小明: { displayName: "小明", kind: "newPlaceholder" },
        小红: { kind: "none" },
      });
    });

    it("选择新建后取消导入只触发取消，不提交新建意图", () => {
      const { onCancel, onConfirm } = renderMapping({
        canCreatePlaceholders: true,
      });

      selectMember("小明", "新建待邀请成员「小明」");
      fireEvent.click(screen.getByRole("button", { name: "取消导入" }));

      expect(onCancel).toHaveBeenCalledTimes(1);
      expect(onConfirm).not.toHaveBeenCalled();
    });

    it("非管理员看不到新建选项", () => {
      renderMapping({ canCreatePlaceholders: false });

      expect(openOptions("小明")).not.toContain("新建待邀请成员「小明」");
      expect(
        screen.queryByText(/点击「继续导入」时才会创建/),
      ).not.toBeInTheDocument();
    });

    it("同名成员不止一个的姓名不提供新建", () => {
      renderMapping({
        canCreatePlaceholders: true,
        candidates: [{ name: "重名", recordCount: 1, reason: "ambiguous" }],
      });

      expect(openOptions("重名")).not.toContain("新建待邀请成员「重名」");
    });

    it("超过 100 个字符的姓名不提供新建，恰好 100 个字符时提供", () => {
      const longName = "あ".repeat(101);
      const maxName = "い".repeat(100);
      renderMapping({
        canCreatePlaceholders: true,
        candidates: [
          { name: longName, recordCount: 1, reason: "unmatched" },
          { name: maxName, recordCount: 1, reason: "unmatched" },
        ],
      });

      expect(openOptions(longName)).not.toContain(
        `新建待邀请成员「${longName}」`,
      );
      fireEvent.keyDown(screen.getByRole("listbox"), { key: "Escape" });
      expect(openOptions(maxName)).toContain(`新建待邀请成员「${maxName}」`);
    });

    it("已有同名待邀请成员时不再提供新建，改为把它排在最前", () => {
      renderMapping({
        canCreatePlaceholders: true,
        candidates: [{ name: "奶奶", recordCount: 1, reason: "unmatched" }],
        placeholders,
      });

      expect(openOptions("奶奶")).toEqual([
        "无持有人",
        "成员",
        "张三",
        "李四",
        placeholderMemberText.accountHolderGroupLabel,
        "奶奶（待邀请）",
        "外婆（待邀请）",
      ]);
    });
  });
});
