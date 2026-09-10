import Box from "@mui/material/Box";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { CategoryChip } from "./CategoryChip";

const category = {
  created_at: "2026-01-01T00:00:00.000Z",
  icon_name: "🍜" as string | null,
  id: "00000000-0000-4000-8000-000000000103",
  name: "外食",
  parent_id: "00000000-0000-4000-8000-000000000101",
  sort_order: 10,
  type: "expense" as const,
};

const meta = {
  title: "Organisms/Categories/CategoryChip",
  component: CategoryChip,
  decorators: [
    (Story) => (
      <Box sx={{ maxWidth: 480, p: 3 }}>
        <Story />
      </Box>
    ),
  ],
  args: {
    canManageCategories: true,
    category,
    handleProps: { "aria-keyshortcuts": "ArrowUp ArrowDown" },
    onEdit: () => {},
    showDragHandle: false,
  },
} satisfies Meta<typeof CategoryChip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "浏览模式分类胶囊",
};

export const Managing: Story = {
  name: "管理排序模式分类胶囊",
  args: { showDragHandle: true },
};

export const ReadOnly: Story = {
  name: "只读分类胶囊",
  args: { canManageCategories: false },
};

export const MissingIcon: Story = {
  name: "缺省分类图标",
  args: { category: { ...category, icon_name: null, name: "其他" } },
};
