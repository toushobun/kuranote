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
  id: "00000000-0000-4000-8000-000000009001",
  merchant_icon_url: null,
  merchant_name: "便利店",
  note: null,
  recorder_color: "amber",
  recorder_name: "淞文",
  tagNames: [],
  transaction_at: "2026-06-05T10:30:00.000Z",
  type: "expense",
};

const meta = {
  title: "Molecules/Transactions/TransactionRowRecorder",
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

export const MultipleMembers: Story = {
  name: "多人账本（成员颜色）",
};

export const SingleMember: Story = {
  name: "单人账本（隐藏记录人）",
  args: {
    item: { ...item, show_recorder: false },
  },
};
