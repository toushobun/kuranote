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
  name: "记录级维度（主金额为本账户份额）",
};

export const AccountShareAndRecordTotal: Story = {
  name: "主金额为命中明细全额",
  args: {
    label: transactionSharedPaymentMessages.accountShareAndRecordTotal(
      transactionSharedPaymentMessages.currentAccountSubject,
      "¥50,000",
      "¥120,000",
    ),
  },
};

export const GroupSummary: Story = {
  name: "组头",
  args: {
    label: transactionSharedPaymentMessages.groupSummary(
      1,
      transactionSharedPaymentMessages.currentAccountSubject,
      "¥50,000",
      "¥120,000",
    ),
  },
};
