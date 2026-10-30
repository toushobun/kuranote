import { expect } from "vitest";
import { fireEvent, screen, within } from "@testing-library/react";
import {
  renderEntryComponent,
  renderTransactionFlow,
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
  return renderTransactionFlow({ ...receiptFlowFixture, ...overrides });
}
export function pressItemAmountKey(name: string) {
  fireEvent.click(
    within(screen.getByLabelText("金额计算器")).getByRole("button", { name }),
  );
}

export function expectAutomaticItems(count: number) {
  expect(
    screen.getByText(`已按你的习惯自动添加 ${count} 条，填金额即可`),
  ).toBeInTheDocument();
  expect(screen.queryByText("自动", { exact: true })).not.toBeInTheDocument();
}

// 以首排铅笔按钮定位包含次排标签的完整小票行。
export function receiptLine(name: string) {
  return screen.getByRole("button", { name }).parentElement!.parentElement!;
}

/** 直接渲染只读小票（#962）：已选 7-Eleven，明细与付款按参数预填。 */
export function renderReadOnlyReceipt(
  itemsOptions: ItemsStepOptions,
  {
    note = "",
    automaticItemIds,
  }: { note?: string; automaticItemIds?: number[] } = {},
) {
  return renderEntryComponent(
    <ReadOnlyReceipt
      itemsOptions={itemsOptions}
      note={note}
      automaticItemIds={automaticItemIds}
    />,
  );
}
