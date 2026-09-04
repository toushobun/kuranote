import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { MerchantTagsField } from "./MerchantTagsField";

const meta = {
  title: "Organisms/Merchants/MerchantTagsField",
  component: MerchantTagsField,
  args: {
    initialTagIds: ["tag-1"],
    tags: [
      {
        icon: "🛒",
        id: "tag-1",
        merchant_count: 2,
        name: "超市",
        sort_order: 0,
      },
      {
        icon: "📦",
        id: "tag-2",
        merchant_count: 1,
        name: "电商",
        sort_order: 1,
      },
    ],
  },
} satisfies Meta<typeof MerchantTagsField>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = { name: "商家分类多选" };
