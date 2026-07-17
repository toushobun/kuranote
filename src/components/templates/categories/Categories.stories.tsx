import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { CategoriesTemplate } from "./Categories";

const categories = [
  {
    children: [
      {
        created_at: "2026-01-01T00:00:00.000Z",
        icon_name: "🍜",
        id: "00000000-0000-4000-8000-000000000102",
        name: "外食",
        parent_id: "00000000-0000-4000-8000-000000000101",
        sort_order: 10,
        type: "expense" as const,
      },
    ],
    created_at: "2026-01-01T00:00:00.000Z",
    icon_name: "🍽️",
    id: "00000000-0000-4000-8000-000000000101",
    name: "餐饮",
    parent_id: null,
    sort_order: 10,
    type: "expense" as const,
  },
  {
    children: [
      {
        created_at: "2026-01-01T00:00:00.000Z",
        icon_name: "💴",
        id: "00000000-0000-4000-8000-000000000104",
        name: "固定工资",
        parent_id: "00000000-0000-4000-8000-000000000103",
        sort_order: 10,
        type: "income" as const,
      },
    ],
    created_at: "2026-01-01T00:00:00.000Z",
    icon_name: "💰",
    id: "00000000-0000-4000-8000-000000000103",
    name: "工资",
    parent_id: null,
    sort_order: 10,
    type: "income" as const,
  },
];

const meta = {
  title: "Templates/Categories/CategoriesTemplate",
  component: CategoriesTemplate,
  args: {
    archiveCategoryAction: async () => {},
    categories,
    createCategoryAction: async () => {},
    errorCategoryId: null,
    errorMessage: null,
    ledgerName: "家庭账本",
    parentOptions: categories.map((category) => ({
      id: category.id,
      name: category.name,
      type: category.type,
    })),
    reorderCategoryAction: async () => ({ ok: true as const }),
    updateCategoryAction: async () => {},
  },
} satisfies Meta<typeof CategoriesTemplate>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "分类管理页面",
};
