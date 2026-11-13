import { TransactionStepFlow } from "organisms/transactions/TransactionStepFlow/TransactionStepFlow";
import type { TransactionStepFlowProps } from "organisms/transactions/TransactionStepFlow/TransactionStepFlow.types";
import { flowFixture } from "./mocks/transactionStepFlow";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactElement } from "react";
import { expect, vi } from "vitest";
import { waitMerchantDrawerClosed } from "test/receiptCreation";
import { ConfirmDialogTestProviders } from "test/ConfirmDialogTestProviders";

export function renderEntryComponent(ui: ReactElement) {
  return render(ui, { wrapper: ConfirmDialogTestProviders });
}
function createFlowCallbacks() {
  return {
    onClose: vi.fn(),
    onMethodChange: vi.fn(),
    onMerchantSelect: vi.fn(),
    onAccountSelect: vi.fn(),
    onAddPresets: vi.fn(),
  };
}
export function createEntryCallbacks() {
  return {
    ...createFlowCallbacks(),
    onAddMerchant: vi.fn(),
    onAddAccount: vi.fn(),
  };
}
export function clickEntryButton(name: string) {
  fireEvent.click(screen.getByRole("button", { name }));
}
export function selectEntryAccount(name = "PayPay JPY") {
  fireEvent.click(screen.getByRole("radio", { name }));
}

export async function addEntryPaymentAccount(name = "PayPay JPY") {
  clickEntryButton("添加付款账户");
  await screen.findByRole("radio", { name });
  selectEntryAccount(name);
  await waitFor(() =>
    expect(screen.queryByRole("radio", { name, hidden: true })).toBeNull(),
  );
  await screen.findByRole("button", { name: "更换支付账户 1" });
}

export function renderTransactionFlow(
  overrides: Partial<TransactionStepFlowProps> = {},
) {
  const props = { ...flowFixture, ...createFlowCallbacks(), ...overrides };
  return { ...renderEntryComponent(<TransactionStepFlow {...props} />), props };
}

export async function selectEntryMerchant(
  name: string | RegExp,
  current = "请选择商家",
) {
  if (!screen.queryByRole("textbox", { name: "搜索商家" })) {
    clickEntryButton(`修改商家：${current}`);
  }
  fireEvent.click(screen.getByRole("button", { name }));
  await waitMerchantDrawerClosed();
}
