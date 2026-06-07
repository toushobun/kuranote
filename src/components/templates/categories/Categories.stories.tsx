import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { CategoriesTemplate } from "./Categories";

const meta = {
  title: "Templates/Categories/CategoriesTemplate",
  component: CategoriesTemplate,
  args: {
    ledgerName: "家庭账本",
  },
} satisfies Meta<typeof CategoriesTemplate>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "分类页面",
};
