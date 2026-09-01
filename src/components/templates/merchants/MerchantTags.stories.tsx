import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { MerchantTagsTemplate } from "./MerchantTags";

const action = async () => ({});
const meta = {
  title: "Templates/Merchants/MerchantTagsTemplate",
  component: MerchantTagsTemplate,
  args: {
    archiveAction: action,
    createAction: action,
    reorderAction: async () => ({}),
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
} satisfies Meta<typeof MerchantTagsTemplate>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { name: "商家标签管理页面" };
