import { fireEvent, screen, within } from "@testing-library/react";
import { renderTransactionFlow } from "./transactionStepFlow";
import { receiptFlowFixture } from "./mocks/transactionReceipt";
import type { TransactionStepFlowProps } from "organisms/transactions/TransactionStepFlow/TransactionStepFlow.types";

export function renderConfirmFlow(
  overrides: Partial<TransactionStepFlowProps> = {},
) {
  return renderTransactionFlow({ ...receiptFlowFixture, ...overrides });
}
export function pressItemAmountKey(name: string) {
  fireEvent.click(
    within(screen.getByLabelText("金额计算器")).getByRole("button", { name }),
  );
}
