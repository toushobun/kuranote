import { fireEvent, render, screen, within } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import {
  GroupedPresetChecklist,
  type GroupedPresetChecklistGroup,
  type GroupedPresetChecklistItem,
  type GroupedPresetChecklistMessages,
} from "./GroupedPresetChecklist";
import {
  getChecklistGroup,
  getChecklistGroupExpandButton,
  getChecklistItemCheckbox,
  toggleChecklistGroup,
} from "./groupedPresetChecklistTestUtils";

const groups: GroupedPresetChecklistGroup[] = [
  {
    icon: "🍎",
    itemKeys: ["apple", "banana", "cherry"],
    key: "fruit",
    name: "水果",
  },
  {
    icon: "🥕",
    itemKeys: ["carrot", "tomato"],
    key: "vegetable",
    name: "蔬菜",
  },
  // 番茄同时属于「水果」以外的另一个分组，用于验证联动。
  { icon: "🍅", itemKeys: ["tomato", "cherry"], key: "red", name: "红色" },
];

const items: GroupedPresetChecklistItem[] = [
  { key: "apple", name: "苹果", secondaryText: "apple.example.com" },
  { key: "banana", name: "香蕉" },
  { key: "cherry", name: "樱桃" },
  { key: "carrot", name: "胡萝卜" },
  { key: "tomato", name: "番茄" },
];

const messages: GroupedPresetChecklistMessages = {
  groupCheckboxLabel: (name) => `选择${name}全部`,
  groupSelectedCount: (selected, total) => `已选 ${selected} / ${total} 个`,
  selectAll: "全选",
  selectNone: "全不选",
};

/** 受控渲染：内部保存勾选状态，并返回 onChange spy。 */
function renderChecklist(initialSelectedKeys: string[] = []) {
  const onChange = vi.fn<(keys: string[]) => void>();

  function Harness() {
    const [selectedKeys, setSelectedKeys] = useState(initialSelectedKeys);
    return (
      <GroupedPresetChecklist
        groups={groups}
        items={items}
        messages={messages}
        onChange={(keys) => {
          onChange(keys);
          setSelectedKeys(keys);
        }}
        selectedKeys={selectedKeys}
      />
    );
  }

  render(<Harness />);
  return { onChange };
}

function getGroupCheckbox(groupName: string) {
  return screen.getByRole("checkbox", { name: `选择${groupName}全部` });
}

describe("GroupedPresetChecklist", () => {
  it("分组行显示名称与已选数量，复选框按全选 / 部分选 / 未选显示三态", () => {
    renderChecklist(["apple", "banana", "cherry"]);

    expect(getChecklistGroup("水果")).toHaveTextContent("已选 3 / 3 个");
    expect(getChecklistGroup("红色")).toHaveTextContent("已选 1 / 2 个");
    expect(getChecklistGroup("蔬菜")).toHaveTextContent("已选 0 / 2 个");
    expect(getGroupCheckbox("水果")).toBeChecked();
    expect(getGroupCheckbox("水果")).toHaveAttribute(
      "data-indeterminate",
      "false",
    );
    expect(getGroupCheckbox("红色")).not.toBeChecked();
    expect(getGroupCheckbox("红色")).toHaveAttribute(
      "data-indeterminate",
      "true",
    );
    expect(getGroupCheckbox("蔬菜")).not.toBeChecked();
    expect(getGroupCheckbox("蔬菜")).toHaveAttribute(
      "data-indeterminate",
      "false",
    );
  });

  it("点击未选或部分选的分组复选框选中全部，全选时取消全部", () => {
    const { onChange } = renderChecklist(["carrot"]);

    fireEvent.click(getGroupCheckbox("蔬菜"));
    expect(onChange).toHaveBeenLastCalledWith(["carrot", "tomato"]);
    expect(getGroupCheckbox("蔬菜")).toBeChecked();

    fireEvent.click(getGroupCheckbox("蔬菜"));
    expect(onChange).toHaveBeenLastCalledWith([]);
    expect(getChecklistGroup("蔬菜")).toHaveTextContent("已选 0 / 2 个");

    fireEvent.click(getGroupCheckbox("水果"));
    expect(onChange).toHaveBeenLastCalledWith(["apple", "banana", "cherry"]);
  });

  it("点击分组行展开 / 收起，点击复选框不展开", () => {
    renderChecklist();
    const expandButton = getChecklistGroupExpandButton("水果");

    expect(expandButton).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(getGroupCheckbox("水果"));
    expect(expandButton).toHaveAttribute("aria-expanded", "false");

    // 点击行内的分组名（行的其他部分）也会展开。
    fireEvent.click(
      within(getChecklistGroup("水果")).getByRole("heading", { name: "水果" }),
    );
    expect(expandButton).toHaveAttribute("aria-expanded", "true");
    expect(getChecklistItemCheckbox("水果", "苹果")).toBeInTheDocument();

    toggleChecklistGroup("水果");
    expect(expandButton).toHaveAttribute("aria-expanded", "false");
  });

  it("展开区域显示项目与副文字，可同时展开多个分组", () => {
    renderChecklist(["apple"]);

    const fruit = toggleChecklistGroup("水果");
    toggleChecklistGroup("蔬菜");

    expect(getChecklistItemCheckbox("水果", "苹果")).toBeChecked();
    expect(getChecklistItemCheckbox("水果", "香蕉")).not.toBeChecked();
    expect(within(fruit).getByText("apple.example.com")).toBeInTheDocument();
    expect(getChecklistItemCheckbox("蔬菜", "胡萝卜")).toBeInTheDocument();
    expect(getChecklistGroupExpandButton("水果")).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });

  it("展开区域顶部的「全选」「全不选」只作用于该分组", () => {
    const { onChange } = renderChecklist(["carrot"]);

    const fruit = toggleChecklistGroup("水果");
    fireEvent.click(within(fruit).getByRole("button", { name: "全选" }));
    expect(onChange).toHaveBeenLastCalledWith([
      "apple",
      "banana",
      "cherry",
      "carrot",
    ]);
    expect(within(fruit).getByRole("button", { name: "全选" })).toBeDisabled();

    fireEvent.click(within(fruit).getByRole("button", { name: "全不选" }));
    expect(onChange).toHaveBeenLastCalledWith(["carrot"]);
    expect(
      within(fruit).getByRole("button", { name: "全不选" }),
    ).toBeDisabled();
  });

  it("同一项目出现在多个分组时勾选状态联动，数量按各分组分别计算", () => {
    const { onChange } = renderChecklist();

    toggleChecklistGroup("蔬菜");
    toggleChecklistGroup("红色");
    fireEvent.click(getChecklistItemCheckbox("蔬菜", "番茄"));

    expect(onChange).toHaveBeenLastCalledWith(["tomato"]);
    expect(getChecklistItemCheckbox("红色", "番茄")).toBeChecked();
    expect(getChecklistGroup("蔬菜")).toHaveTextContent("已选 1 / 2 个");
    expect(getChecklistGroup("红色")).toHaveTextContent("已选 1 / 2 个");
    expect(getGroupCheckbox("红色")).toHaveAttribute(
      "data-indeterminate",
      "true",
    );

    // 通过「红色」的分组复选框全选后，「水果」中的樱桃也变为选中。
    fireEvent.click(getGroupCheckbox("红色"));
    expect(onChange).toHaveBeenLastCalledWith(["cherry", "tomato"]);
    expect(getChecklistGroup("水果")).toHaveTextContent("已选 1 / 3 个");
  });

  it("disabled 时禁用全部复选框与展开区域的按钮", () => {
    render(
      <GroupedPresetChecklist
        disabled
        groups={groups}
        items={items}
        messages={messages}
        onChange={() => {}}
        selectedKeys={["apple"]}
      />,
    );

    const fruit = toggleChecklistGroup("水果");

    expect(getGroupCheckbox("水果")).toBeDisabled();
    expect(getChecklistItemCheckbox("水果", "苹果")).toBeDisabled();
    expect(within(fruit).getByRole("button", { name: "全选" })).toBeDisabled();
  });
});
