import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { LinkedTransactionSyncConfirmationDialog } from "./LinkedTransactionSyncConfirmationDialog";

const meta = {
  title: "Organisms/Transactions/LinkedTransactionSyncConfirmationDialog",
  component: LinkedTransactionSyncConfirmationDialog,
  args: {
    onCancel: () => undefined,
    onConfirm: () => undefined,
    open: true,
  },
} satisfies Meta<typeof LinkedTransactionSyncConfirmationDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "已关联明细同步确认",
};
