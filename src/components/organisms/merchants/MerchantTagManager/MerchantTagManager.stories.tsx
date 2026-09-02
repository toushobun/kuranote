import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { MerchantTagManager } from "./MerchantTagManager";

const meta = {
  title: "Organisms/Merchants/MerchantTagManager",
  component: MerchantTagManager,
  args: {
    canManage: true,
    keyword: "",
    selectedTagId: null,
    tags: [
      {
        icon: "🛒",
        id: "tag-1",
        merchant_count: 6,
        name: "超市",
        sort_order: 0,
      },
      {
        icon: "🍽️",
        id: "tag-2",
        merchant_count: 4,
        name: "餐饮",
        sort_order: 1,
      },
      {
        icon: "📦",
        id: "tag-3",
        merchant_count: 2,
        name: "电商",
        sort_order: 2,
      },
    ],
  },
} satisfies Meta<typeof MerchantTagManager>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = { args: meta.args, name: "商家标签筛选" };

export const Selected: Story = {
  args: { ...meta.args, selectedTagId: "tag-1" },
  name: "选中标签",
};
