import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { transactionSharedPaymentMessages } from "utils/transactionMessages";

import { TransactionSharedPaymentNote } from "./TransactionSharedPaymentNote";

const meta = {
  title: "Atoms/Transactions/TransactionSharedPaymentNote",
  component: TransactionSharedPaymentNote,
  args: {
    label: transactionSharedPaymentMessages.recordTotal("¥120,000"),
  },
} satisfies Meta<typeof TransactionSharedPaymentNote>;

export default meta;
type Story = StoryObj<typeof meta>;

export const RecordTotal: Story = {
  name: "列表行",
};

export const GroupSummary: Story = {
  name: "组头",
  args: {
    label: transactionSharedPaymentMessages.groupSummary(1, "¥120,000"),
  },
};
