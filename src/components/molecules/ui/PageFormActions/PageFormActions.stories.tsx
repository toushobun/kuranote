import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { PageFormActions } from "./PageFormActions";

const meta = {
  title: "Molecules/UI/PageFormActions",
  component: PageFormActions,
  args: {
    cancelHref: "/accounts",
    cancelLabel: "取消",
    pendingLabel: "保存中",
    submitLabel: "保存账户",
  },
} satisfies Meta<typeof PageFormActions>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { name: "默认" };
export const Pending: Story = { name: "提交中", args: { pending: true } };
