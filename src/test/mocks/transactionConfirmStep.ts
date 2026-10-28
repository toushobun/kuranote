import type { TransactionStepFlowProps } from "organisms/transactions/TransactionStepFlow/TransactionStepFlow.types";
import { flowFixture } from "./transactionStepFlow";
import { filledItems, itemsStepFixture } from "./transactionItemsStep";
export const confirmFlowFixture: TransactionStepFlowProps = {
  ...flowFixture,
  initialStep: 4,
  initialMerchantId: "seven",
  initialAccountId: "paypay",
  initialCompletedSteps: [1, 2, 3],
  itemsOptions: { ...itemsStepFixture, initialItems: filledItems },
  action: async () => ({}),
};
