import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { TransactionRefundLinkPicker } from "./TransactionRefundLinkPicker";

const meta = {
  title: "Organisms/Transactions/TransactionRefundLinkPicker",
  component: TransactionRefundLinkPicker,
  args: { onChange() {}, value: null },
} satisfies Meta<typeof TransactionRefundLinkPicker>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
