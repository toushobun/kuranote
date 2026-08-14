import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { createRef } from "react";

import { transactionSpecialStatuses } from "internal/transaction";
import type { TransactionItemSummary } from "../TransactionForm/TransactionForm.types";
import { TransactionItemsSection } from "./TransactionItemsSection";

const itemSummaries: TransactionItemSummary[] = transactionSpecialStatuses.map(
  (specialStatus, index) => ({
    amount: String((index + 1) * 500),
    category: {
      id: `category-${index}`,
      name: ["午餐", "衣服", "交通费", "日用品", "公司聚餐"][index],
      parentId: `category-group-${index}`,
      parentName: ["餐饮", "购物", "交通", "生活", "社交"][index],
      type: "expense",
    },
    categoryId: `category-${index}`,
    id: index + 1,
    specialStatus,
  }),
);

const meta = {
  title: "Organisms/Transactions/TransactionItemsSection",
  component: TransactionItemsSection,
  args: {
    hasCategoryOptions: true,
    itemsFieldRef: createRef<HTMLDivElement>(),
    itemSummaries,
    onOpenItem: () => undefined,
    onOpenSheet: () => undefined,
    onUpdateItem: () => undefined,
    selectedAccountCurrency: "JPY",
    selectedType: "expense",
    signedTotalAmount: "-7500",
  },
} satisfies Meta<typeof TransactionItemsSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllStatuses: Story = {
  name: "全部特殊状态",
};

export const NoStatus: Story = {
  name: "无徽标",
  args: {
    itemSummaries: itemSummaries.slice(0, 1).map((item) => ({
      ...item,
      specialStatus: null,
    })),
    signedTotalAmount: "-500",
  },
};

export const PartiallyOffsetExpense: Story = {
  name: "部分抵消支出",
  args: {
    businessTotalAmount: "-300",
    itemSummaries: [
      {
        ...itemSummaries[0],
        amount: "500",
        businessNetAmount: "300",
        refundedAmount: "200",
      },
    ],
    signedTotalAmount: "-500",
  },
};

export const FullyOffsetExpense: Story = {
  name: "完全抵消支出",
  args: {
    businessTotalAmount: "0",
    itemSummaries: [
      {
        ...itemSummaries[0],
        amount: "500",
        businessNetAmount: "0",
        specialStatus: "reimbursed",
      },
    ],
    signedTotalAmount: "-500",
  },
};

export const RefundIncome: Story = {
  name: "退款收入",
  args: {
    businessTotalAmount: "0",
    itemSummaries: [
      {
        ...itemSummaries[0],
        amount: "200",
        businessNetAmount: "0",
        businessStatus: "refund",
        category: { ...itemSummaries[0].category!, type: "income" },
      },
    ],
    selectedType: "income",
    signedTotalAmount: "+200",
  },
};

export const ReimbursementIncome: Story = {
  name: "报销收入",
  args: {
    businessTotalAmount: "0",
    itemSummaries: [
      {
        ...itemSummaries[0],
        amount: "500",
        businessNetAmount: "0",
        businessStatus: "reimbursement",
        category: { ...itemSummaries[0].category!, type: "income" },
      },
    ],
    selectedType: "income",
    signedTotalAmount: "+500",
  },
};

export const Empty: Story = {
  name: "空状态",
  args: { itemSummaries: [], signedTotalAmount: "未填写金额" },
};
