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
