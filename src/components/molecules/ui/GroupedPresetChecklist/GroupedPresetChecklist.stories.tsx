import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState, type ComponentProps } from "react";
import { userEvent, within } from "storybook/test";

import {
  GroupedPresetChecklist,
  type GroupedPresetChecklistGroup,
  type GroupedPresetChecklistItem,
} from "./GroupedPresetChecklist";

const groups: GroupedPresetChecklistGroup[] = [
  {
    icon: "🛒",
    itemKeys: ["aeon", "seiyu", "life"],
    key: "supermarket",
    name: "超市",
  },
  {
    icon: "📦",
    itemKeys: ["amazon", "rakuten", "mercari"],
    key: "ecommerce",
    name: "电商",
  },
  {
    icon: "🎬",
    itemKeys: ["amazon", "netflix", "spotify"],
    key: "subscription",
    name: "订阅服务",
  },
];

const items: GroupedPresetChecklistItem[] = [
  { key: "aeon", name: "イオン", secondaryText: "aeon.com" },
  { key: "seiyu", name: "西友", secondaryText: "seiyu.co.jp" },
  { key: "life", name: "ライフ", secondaryText: "lifecorp.jp" },
  { key: "amazon", name: "Amazon", secondaryText: "amazon.co.jp" },
  { key: "rakuten", name: "楽天", secondaryText: "rakuten.co.jp" },
  { key: "mercari", name: "メルカリ" },
  { key: "netflix", name: "Netflix", secondaryText: "netflix.com" },
  { key: "spotify", name: "Spotify", secondaryText: "spotify.com" },
];

/** 受控示例：在 Story 内保存勾选状态。 */
function ControlledChecklist(
  props: ComponentProps<typeof GroupedPresetChecklist>,
) {
  const [selectedKeys, setSelectedKeys] = useState(props.selectedKeys);
  return (
    <GroupedPresetChecklist
      {...props}
      onChange={(keys) => {
        props.onChange(keys);
        setSelectedKeys(keys);
      }}
      selectedKeys={selectedKeys}
    />
  );
}

const meta = {
  title: "Molecules/UI/GroupedPresetChecklist",
  component: GroupedPresetChecklist,
  render: (args) => <ControlledChecklist {...args} />,
  args: {
    groups,
    items,
    messages: {
      groupCheckboxLabel: (name) => `选择「${name}」的全部项目`,
      groupSelectedCount: (selected, total) => `已选 ${selected} / ${total} 家`,
      selectAll: "全选",
      selectNone: "全不选",
    },
    onChange: () => {},
    selectedKeys: ["aeon", "seiyu", "life"],
  },
  parameters: { viewport: { defaultViewport: "mobile2" } },
} satisfies Meta<typeof GroupedPresetChecklist>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Collapsed: Story = {
  name: "收起",
};

export const ExpandedMultiple: Story = {
  name: "展开多个分组（多分组项目联动）",
  args: { selectedKeys: ["aeon", "amazon"] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "电商" }));
    await userEvent.click(canvas.getByRole("button", { name: "订阅服务" }));
  },
};

export const PartiallySelected: Story = {
  name: "部分选中",
  args: { selectedKeys: ["aeon", "amazon", "netflix"] },
};
