import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { TransactionSummarySection } from "./TransactionSummarySection";

const meta = {
  title: "Organisms/Transactions/TransactionSummarySection",
  component: TransactionSummarySection,
  args: {
    itemSummaries: [
      {
        amount: "500",
        category: {
          id: "category-lunch",
          name: "午餐",
          parentId: "category-food",
          parentName: "餐饮",
          type: "expense",
        },
        categoryId: "category-lunch",
        id: 1,
      },
    ],
    selectedAccount: {
      currency: "JPY",
      id: "account-cash",
      name: "现金",
    },
    selectedMerchant: {
      icon_url: null,
      id: "merchant-store",
      name: "便利店",
    },
    signedTotalAmount: "-500",
    transactionDate: "2026-08-14",
    transactionTime: "12:30:00",
  },
} satisfies Meta<typeof TransactionSummarySection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "普通支出",
};

export const PartiallyOffset: Story = {
  name: "部分抵消",
  args: {
    businessTotalAmount: "-300",
    itemSummaries: [
      {
        ...meta.args.itemSummaries[0],
        businessNetAmount: "300",
      },
    ],
  },
};

export const FullyOffset: Story = {
  name: "完全抵消",
  args: {
    businessTotalAmount: "0",
    itemSummaries: [
      {
        ...meta.args.itemSummaries[0],
        businessNetAmount: "0",
        specialStatus: "reimbursed",
      },
    ],
  },
};
