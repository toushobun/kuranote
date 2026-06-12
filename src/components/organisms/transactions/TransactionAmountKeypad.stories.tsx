import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { TransactionAmountKeypad } from "./TransactionAmountKeypad";

const meta = {
  title: "Organisms/Transactions/TransactionAmountKeypad",
  component: TransactionAmountKeypad,
  args: {
    value: "",
    onChange: () => {},
    onConfirm: () => {},
  },
} satisfies Meta<typeof TransactionAmountKeypad>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Jpy: Story = {
  args: {
    currency: "JPY",
  },
};
