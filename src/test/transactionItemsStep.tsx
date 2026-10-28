import { fireEvent, screen, within } from "@testing-library/react";
import { vi } from "vitest";
import {
  TransactionItemsStepHarness,
  type ItemsStepHarnessProps,
} from "test/TransactionItemsStepHarness";
import { itemsStepFixture } from "test/mocks/transactionItemsStep";
import {
  renderEntryComponent,
  clickEntryButton,
} from "test/transactionStepFlow";

export function renderItemsStep(
  overrides: Partial<ItemsStepHarnessProps> = {},
) {
  const props = {
    ...itemsStepFixture,
    onConfirm: vi.fn(),
    ...overrides,
  };
  return {
    props,
    ...renderEntryComponent(<TransactionItemsStepHarness {...props} />),
  };
}
export async function addStepItem(name = "午餐", group?: string) {
  clickEntryButton("添加明细");
  if (group) clickEntryButton(group);
  clickEntryButton(name);
  clickEntryButton("确定");
  return screen.findByLabelText("金额计算器");
}
export function pressItemAmountKey(name: string) {
  fireEvent.click(
    within(screen.getByLabelText("金额计算器")).getByRole("button", { name }),
  );
}
