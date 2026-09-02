import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";

import { EmojiIconField } from "./EmojiIconField";

const meta = {
  title: "Molecules/UI/EmojiIconField",
  component: EmojiIconField,
  args: {
    fieldLabel: "标签图标",
    groups: [{ id: "shop", label: "零售" }],
    helperText: "选择一个便于识别的 Emoji。",
    inputName: "icon",
    onChange: () => {},
    options: [
      { emoji: "🛒", groupId: "shop", keywords: ["采购"], label: "超市" },
      { emoji: "🏪", groupId: "shop", keywords: ["商店"], label: "便利店" },
    ],
    searchPlaceholder: "例如：超市",
    value: "🛒",
  },
  render: function EmojiIconFieldStory(args) {
    const [value, setValue] = useState(args.value);
    return <EmojiIconField {...args} onChange={setValue} value={value} />;
  },
} satisfies Meta<typeof EmojiIconField>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = { name: "Emoji 选择器" };
