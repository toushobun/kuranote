import { userEvent, within } from "storybook/test";
import type { Decorator } from "@storybook/nextjs-vite";
import { ReceiptCreationProvider } from "organisms/transactions/ReceiptCreationProvider/ReceiptCreationProvider";
import { receiptCreationData } from "test/mocks/receiptCreation";
import { ConfirmDialogProvider } from "providers/ConfirmDialogProvider/ConfirmDialogProvider";

export const transactionEntryStoryDecorators: Decorator[] = [
  (Story) => (
    <ConfirmDialogProvider>
      <Story />
    </ConfirmDialogProvider>
  ),
];

export const receiptCreationStoryDecorator: Decorator = (Story) => (
  <ReceiptCreationProvider data={receiptCreationData()}>
    <Story />
  </ReceiptCreationProvider>
);

export async function openMerchantStoryDrawer(canvasElement: HTMLElement) {
  const body = within(canvasElement.ownerDocument.body);
  await userEvent.click(
    await body.findByRole("button", { name: "修改商家：请选择商家" }),
  );
  return body;
}
