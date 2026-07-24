import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { CategoryList } from "./CategoryList";

const categories = [
  {
    children: [
      {
        created_at: "2026-01-01T00:00:00.000Z",
        icon_name: "🍞",
        id: "00000000-0000-4000-8000-000000000103",
        name: "早餐",
        parent_id: "00000000-0000-4000-8000-000000000101",
        sort_order: 10,
        type: "expense" as const,
      },
      {
        created_at: "2026-01-01T00:00:00.000Z",
        icon_name: "🍜",
        id: "00000000-0000-4000-8000-000000000104",
        name: "外食",
        parent_id: "00000000-0000-4000-8000-000000000101",
        sort_order: 20,
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
    children: [],
    created_at: "2026-01-01T00:00:00.000Z",
    icon_name: "🛒",
    id: "00000000-0000-4000-8000-000000000102",
    name: "日常购物",
    parent_id: null,
    sort_order: 20,
    type: "expense" as const,
  },
  {
    children: [
      {
        created_at: "2026-01-01T00:00:00.000Z",
        icon_name: "💴",
        id: "00000000-0000-4000-8000-000000000106",
        name: "固定工资",
        parent_id: "00000000-0000-4000-8000-000000000105",
        sort_order: 10,
        type: "income" as const,
      },
    ],
    created_at: "2026-01-01T00:00:00.000Z",
    icon_name: "💰",
    id: "00000000-0000-4000-8000-000000000105",
    name: "工资",
    parent_id: null,
    sort_order: 10,
    type: "income" as const,
  },
];

const meta = {
  title: "Organisms/Categories/CategoryList",
  component: CategoryList,
  args: {
    archiveCategoryAction: async () => {},
    categories,
    errorCategoryId: null,
    errorMessage: null,
    reorderCategoryAction: async () => ({ ok: true as const }),
    updateCategoryAction: async () => {},
  },
} satisfies Meta<typeof CategoryList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "分类管理列表",
};

export const ReadOnly: Story = {
  name: "只读列表",
  args: { canManageCategories: false },
};

export const Empty: Story = {
  name: "空状态",
  args: { categories: [] },
};

export const WithError: Story = {
  name: "带错误提示",
  args: {
    errorCategoryId: "00000000-0000-4000-8000-000000000101",
    errorMessage: "分类更新失败。",
  },
};
