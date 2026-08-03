import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import type {
  TransactionDateGroup,
  TransactionListItem,
} from "types/transactions";

import {
  TransactionGroupList,
  TransactionRefundCandidateList,
} from "./TransactionGroupList";

const groups: TransactionDateGroup[] = [
  {
    date: "2026-06-05",
    label: "06/05 周五",
    summary: {
      currency: "JPY",
      income: "0",
      expense: "3120",
      balance: "-3120",
    },
    items: [
      {
        id: "00000000-0000-4000-8000-000000009001",
        type: "expense",
        transaction_at: "2026-06-05T03:20:10.000Z",
        amount: "1200",
        account_name: "日元现金",
        account_currency: "JPY",
        categoryItems: [
          {
            categoryName: "餐饮",
            parentCategoryName: "饮食",
            amount: "1200",
          },
        ],
        merchant_name: "便利店",
        merchant_icon_url: null,
        note: null,
        recorder_name: null,
        created_at: "2026-06-05T03:20:10.000Z",
      },
    ],
  },
];

const refundCandidateItems: TransactionListItem[] = [
  {
    account_currency: "USD",
    account_name: "信用卡",
    amount: "200",
    categoryItems: [
      {
        accountId: "00000000-0000-4000-8000-000000008001",
        amount: "120",
        categoryName: "服装",
        categoryType: "expense",
        id: "partial-item",
        parentCategoryName: "购物",
        refundedAmount: "20",
        remainingRefundableAmount: "100",
      },
      {
        accountId: "00000000-0000-4000-8000-000000008001",
        amount: "80",
        categoryName: "日用品",
        categoryType: "expense",
        id: "completed-item",
        parentCategoryName: "购物",
        refundedAmount: "80",
        remainingRefundableAmount: "0",
      },
    ],
    created_at: "2026-08-01T00:00:00.000Z",
    id: "record-1",
    merchant_icon_url: null,
    merchant_name: "商店",
    note: null,
    recorder_name: null,
    transaction_at: "2026-08-01T00:00:00.000Z",
    type: "expense",
  },
];

const meta = {
  title: "Organisms/Transactions/TransactionGroupList",
  component: TransactionGroupList,
  args: {
    groups,
  },
} satisfies Meta<typeof TransactionGroupList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "按日期分组的记账列表",
};

export const RefundCandidateStates: Story = {
  name: "退款候选的部分退款与已退完状态",
  render: () => (
    <TransactionRefundCandidateList
      items={refundCandidateItems}
      onSelect={() => undefined}
    />
  ),
};
