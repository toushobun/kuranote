import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { UserThemeProvider } from "theme/UserThemeProvider";

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
  decorators: [
    (Story) => (
      <UserThemeProvider storageScope="storybook-category-dialog">
        <Story />
      </UserThemeProvider>
    ),
  ],
  args: {
    archiveCategoryAction: async () => {},
    categories,
    onReorderError: () => {},
    reorderCategoryAction: async () => ({}),
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

export const DragSorting: Story = {
  name: "拖动临时收起，松手恢复展开",
  parameters: {
    docs: {
      description: {
        story:
          "拖动大分类时临时收起全部小分类，松手或按 Escape 后恢复原展开状态。小分类仅在原大分类内排序；支持触屏拖动与直接按上下方向键排序。",
      },
    },
  },
};

export const DialogButtons: Story = {
  name: "弹窗等宽按钮与归档样式",
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole("button", { name: "编辑餐饮" }),
    );
    const dialog = within(
      await within(canvasElement.ownerDocument.body).findByRole("dialog"),
    );
    const cancel = dialog.getByRole("button", { name: "取消" });
    const submit = dialog.getByRole("button", { name: "保存" });
    await expect(cancel.getBoundingClientRect().width).toBeCloseTo(
      submit.getBoundingClientRect().width,
      0,
    );
    await expect(cancel.getBoundingClientRect().top).toBe(
      submit.getBoundingClientRect().top,
    );
    const archive = dialog.getByRole("button", { name: "归档该分类" });
    await expect(archive.getBoundingClientRect().bottom).toBeLessThan(
      cancel.getBoundingClientRect().top,
    );
  },
};
