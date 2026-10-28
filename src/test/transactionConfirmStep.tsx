import { renderTransactionFlow } from "./transactionStepFlow";
import { confirmFlowFixture } from "./mocks/transactionConfirmStep";
import type { TransactionStepFlowProps } from "organisms/transactions/TransactionStepFlow/TransactionStepFlow.types";

export function renderConfirmFlow(
  overrides: Partial<TransactionStepFlowProps> = {},
) {
  return renderTransactionFlow({ ...confirmFlowFixture, ...overrides });
}
