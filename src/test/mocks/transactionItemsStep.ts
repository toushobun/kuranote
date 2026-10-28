import type { ItemsStepHarnessProps } from "test/TransactionItemsStepHarness";
import { flowFixture } from "./transactionStepFlow";

export const itemsStepFixture: ItemsStepHarnessProps = {
  accountOptions: flowFixture.accounts,
  selectedAccount: flowFixture.accounts[1],
  categoryOptions: [
    {
      id: "lunch",
      name: "午餐",
      parentId: "food",
      parentName: "餐饮",
      type: "expense",
    },
    {
      id: "coffee",
      name: "咖啡",
      parentId: "drink",
      parentName: "饮料",
      type: "expense",
    },
    {
      id: "storage",
      name: "收纳",
      parentId: "daily",
      parentName: "日用品",
      type: "expense",
    },
    {
      id: "points",
      name: "积分返还",
      parentId: "other",
      parentName: "其他收入",
      type: "income",
    },
  ],
  suggestions: {
    automaticCategoryIds: ["lunch", "coffee"],
    recommendedAccountIds: [],
    quickAmounts: [
      {
        categoryId: "lunch",
        currency: "JPY",
        lastAmount: "498",
        frequentAmounts: ["398", "450", "520", "580"],
      },
      {
        categoryId: "coffee",
        currency: "JPY",
        lastAmount: "250",
        frequentAmounts: ["200"],
      },
      {
        categoryId: "lunch",
        currency: "CNY",
        lastAmount: "18.50",
        frequentAmounts: ["20.00"],
      },
    ],
  },
  merchantHasHistory: true,
  multiAccountPaymentEnabled: true,
  transactionItemSpecialStatusEnabled: true,
  onConfirm: () => {},
};
export const filledItems = [
  { categoryId: "lunch", amount: "8000" },
  { categoryId: "storage", amount: "2000" },
];
export const twoPayments = [
  { accountId: "paypay", amount: "7000" },
  { accountId: "cash", amount: "3000" },
];
