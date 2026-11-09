import { expect } from "vitest";
import { fireEvent, screen, within } from "@testing-library/react";
import {
  renderEntryComponent,
  renderTransactionFlow,
  clickEntryButton,
} from "./transactionStepFlow";
import { receiptFlowFixture } from "./mocks/transactionReceipt";
import { ReadOnlyReceipt } from "./ReadOnlyReceipt";
import type {
  ItemsStepOptions,
  TransactionStepFlowProps,
} from "organisms/transactions/TransactionStepFlow/TransactionStepFlow.types";

export function renderConfirmFlow(
  overrides: Partial<TransactionStepFlowProps> = {},
) {
  const itemsOptions = {
    ...(overrides.itemsOptions ?? receiptFlowFixture.itemsOptions),
    initialPayments:
      overrides.itemsOptions?.initialPayments ??
      receiptFlowFixture.itemsOptions?.initialPayments,
    categoryOptions:
      overrides.itemsOptions?.categoryOptions ??
      receiptFlowFixture.itemsOptions?.categoryOptions ??
      [],
  };
  const view = renderTransactionFlow({
    ...receiptFlowFixture,
    ...overrides,
    itemsOptions,
    suggestionsMerchantId:
      overrides.suggestionsMerchantId ??
      (itemsOptions.initialItems?.length ? undefined : "seven"),
  });
  clickEntryButton("7-Eleven");
  return view;
}
export function pressItemAmountKey(name: string) {
  fireEvent.click(
    within(screen.getByLabelText("金额计算器")).getByRole("button", { name }),
  );
}

export function expectNoPaymentRow() {
  expect(
    screen.getByRole("button", { name: "添加付款账户" }),
  ).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "更换支付账户 1" })).toBeNull();
  expect(screen.queryByText("选择收支账户")).toBeNull();
}

export function expectAutomaticNotice(visible = true) {
  const notice = screen.queryByText("已按照你的习惯自动添加部分内容");
  if (visible) expect(notice).toBeInTheDocument();
  else expect(notice).not.toBeInTheDocument();
}

// 以首排铅笔按钮定位包含次排标签的完整小票行。
export function receiptLine(name: string) {
  return screen
    .getByRole("button", { name })
    .closest<HTMLElement>("[data-receipt-line]")!;
}

/** 直接渲染只读小票（#962）：已选 7-Eleven，明细与付款按参数预填。 */
export function renderReadOnlyReceipt(
  itemsOptions: ItemsStepOptions,
  { note = "" }: { note?: string } = {},
) {
  return renderEntryComponent(
    <ReadOnlyReceipt itemsOptions={itemsOptions} note={note} />,
  );
}
