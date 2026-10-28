import type { Decorator } from "@storybook/nextjs-vite";
import { ConfirmDialogProvider } from "providers/ConfirmDialogProvider/ConfirmDialogProvider";

export const transactionEntryStoryDecorators: Decorator[] = [
  (Story) => (
    <ConfirmDialogProvider>
      <Story />
    </ConfirmDialogProvider>
  ),
];
