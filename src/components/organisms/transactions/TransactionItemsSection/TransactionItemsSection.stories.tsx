import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { createRef } from "react";

import type { TransactionItemSummary } from "../TransactionForm/TransactionForm.types";
import { transactionBusinessBadgeStatuses } from "../TransactionBusinessBadge/transactionBusinessBadgeConfig";
import { TransactionItemsSection } from "./TransactionItemsSection";

const itemSummaries: TransactionItemSummary[] =
  transactionBusinessBadgeStatuses.map((specialStatus, index) => ({
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
  }));

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

export const Empty: Story = {
  name: "空状态",
  args: { itemSummaries: [], signedTotalAmount: "未填写金额" },
};
