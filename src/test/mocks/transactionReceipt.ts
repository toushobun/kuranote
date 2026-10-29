import type { MerchantEntrySuggestions } from "internal/transaction";
import type {
  ItemsStepOptions,
  TransactionStepFlowProps,
} from "organisms/transactions/TransactionStepFlow/TransactionStepFlow.types";

export const receiptItemsOptions: ItemsStepOptions = {
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
  multiAccountPaymentEnabled: true,
  transactionItemSpecialStatusEnabled: true,
};
export const receiptSuggestions: MerchantEntrySuggestions = {
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
};
export const filledItems = [
  { categoryId: "lunch", amount: "8000" },
  { categoryId: "storage", amount: "2000" },
];
export const twoPayments = [
  { accountId: "paypay", amount: "7000" },
  { accountId: "cash", amount: "3000" },
];

/** 小票：已选 7-Eleven 与 PayPay，两条已填金额的明细。 */
export const receiptFlowFixture: Partial<TransactionStepFlowProps> = {
  initialMerchantId: "seven",
  initialAccountId: "paypay",
  itemsOptions: { ...receiptItemsOptions, initialItems: filledItems },
};
