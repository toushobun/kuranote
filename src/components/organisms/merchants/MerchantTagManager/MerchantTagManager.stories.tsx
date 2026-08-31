import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { MerchantTagManager } from "./MerchantTagManager";

const action = async () => ({});
const meta = {
  title: "Organisms/Merchants/MerchantTagManager",
  component: MerchantTagManager,
  args: {
    archiveAction: action,
    canManage: true,
    createAction: action,
    keyword: "",
    reorderAction: async () => ({}),
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
    updateAction: action,
  },
} satisfies Meta<typeof MerchantTagManager>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = { name: "商家标签筛选与管理" };
