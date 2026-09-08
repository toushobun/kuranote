import Box from "@mui/material/Box";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import type { TransactionRowItem } from "types/transactions";

import { TransactionRow } from "./TransactionRow";

const item: TransactionRowItem = {
  account_color: "sakura",
  account_currency: "JPY",
  account_name: "日元现金",
  amount: "1200",
  categoryItems: [
    {
      amount: "1200",
      categoryName: "餐饮",
      categoryType: "expense",
      parentCategoryName: "饮食",
    },
  ],
  consumers: [
    { color: "amber", id: "member-1", name: "淞文" },
    { color: "sakura", id: "member-2", name: "秋爽" },
    { color: "sky", id: "member-3", name: "宝宝" },
  ],
  id: "00000000-0000-4000-8000-000000009001",
  merchant_icon_url: null,
  merchant_name: "便利店",
  note: null,
  transaction_at: "2026-09-08T10:30:00.000Z",
  type: "expense",
};

const meta = {
  title: "Molecules/Transactions/TransactionRowConsumer",
  component: TransactionRow,
  decorators: [
    (Story) => (
      <Box sx={{ bgcolor: "common.white", minHeight: "100vh" }}>
        <Story />
      </Box>
    ),
  ],
  args: {
    item,
    receiptCard: true,
    showAccount: true,
    showRecorder: true,
    showTime: true,
  },
} satisfies Meta<typeof TransactionRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MultipleConsumers: Story = {
  name: "多人消费者（最多 2 人 + N）",
};

export const SingleConsumer: Story = {
  name: "单个消费者",
  args: {
    item: { ...item, consumers: [item.consumers![0]!] },
  },
};

export const SingleMemberLedger: Story = {
  name: "单人账本（隐藏消费者）",
  args: {
    item: { ...item, show_recorder: false },
  },
};
