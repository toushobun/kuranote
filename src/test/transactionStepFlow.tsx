import { TransactionStepFlow } from "organisms/transactions/TransactionStepFlow/TransactionStepFlow";
import type { TransactionStepFlowProps } from "organisms/transactions/TransactionStepFlow/TransactionStepFlow.types";
import { flowFixture } from "./mocks/transactionStepFlow";
import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { vi } from "vitest";
import { ConfirmDialogTestProviders } from "test/ConfirmDialogTestProviders";

export function renderEntryComponent(ui: ReactElement) {
  return render(ui, { wrapper: ConfirmDialogTestProviders });
}
export function createEntryCallbacks() {
  return {
    onClose: vi.fn(),
    onMethodChange: vi.fn(),
    onMerchantSelect: vi.fn(),
    onAccountSelect: vi.fn(),
    onAddMerchant: vi.fn(),
    onAddAccount: vi.fn(),
    onAddPresets: vi.fn(),
  };
}
export function clickEntryButton(name: string) {
  fireEvent.click(screen.getByRole("button", { name }));
}
export function selectEntryAccount(name = "PayPay JPY") {
  fireEvent.click(screen.getByRole("radio", { name }));
}

export function renderTransactionFlow(
  overrides: Partial<TransactionStepFlowProps> = {},
) {
  const props = { ...flowFixture, ...createEntryCallbacks(), ...overrides };
  return { ...renderEntryComponent(<TransactionStepFlow {...props} />), props };
}
