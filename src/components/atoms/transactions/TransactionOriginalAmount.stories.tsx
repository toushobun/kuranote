import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { TransactionOriginalAmount } from "./TransactionOriginalAmount";

const meta = {
  title: "Atoms/Transactions/TransactionOriginalAmount",
  component: TransactionOriginalAmount,
  args: {
    amount: "- ¥ 500",
  },
} satisfies Meta<typeof TransactionOriginalAmount>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "原金额",
};

export const Parenthesized: Story = {
  name: "行内括号",
  args: {
    parenthesized: true,
  },
};
