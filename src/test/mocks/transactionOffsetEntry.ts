import type { TransactionOffsetEntry } from "internal/transaction";
import { candidateItems } from "organisms/transactions/TransactionLinkCandidatePanel/transactionLinkCandidateFixtures";
import { receiptItemsOptions } from "./transactionReceipt";

export const offsetEntry: TransactionOffsetEntry = {
  kind: "refund",
  merchantId: "seven",
  accountId: "paypay",
  candidates: candidateItems.slice(0, 2).map((candidate, index) => ({
    ...candidate,
    id: `source-item-${index}`,
    accountId: "paypay",
    merchantId: "seven",
    merchantName: "7-Eleven",
    transactionRecordId: "source-record",
    categoryName: index === 0 ? "旧午餐" : "旧咖啡",
  })),
};
export const offsetItemsOptions = {
  ...receiptItemsOptions,
  categoryOptions: [
    ...receiptItemsOptions.categoryOptions,
    {
      id: "system-refund",
      name: "退款",
      parentId: "income",
      parentName: "收入",
      type: "income" as const,
      systemKey: "refund" as const,
    },
    {
      id: "system-reimbursement",
      name: "报销",
      parentId: "income",
      parentName: "收入",
      type: "income" as const,
      systemKey: "reimbursement" as const,
    },
  ],
};
