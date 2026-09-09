import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { CategoryDialogActions } from "./CategoryDialogActions";

const meta = {
  title: "Organisms/Categories/CategoryDialogActions",
  component: CategoryDialogActions,
  args: { onCancel: () => {}, submitLabel: "保存" },
} satisfies Meta<typeof CategoryDialogActions>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { name: "左右等宽操作" };
export const Disabled: Story = { name: "不可提交", args: { disabled: true } };
