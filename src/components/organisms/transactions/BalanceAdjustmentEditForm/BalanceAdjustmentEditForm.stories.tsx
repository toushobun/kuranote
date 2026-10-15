import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ConfirmDialogProvider } from "providers/ConfirmDialogProvider/ConfirmDialogProvider";
import { BalanceAdjustmentEditForm } from "./BalanceAdjustmentEditForm";
const meta = {
  component: BalanceAdjustmentEditForm,
  title: "Organisms/Transactions/BalanceAdjustmentEditForm",
  decorators: [
    (Story) => (
      <ConfirmDialogProvider>
        <Story />
      </ConfirmDialogProvider>
    ),
  ],
  args: {
    action: async () => ({}),
    deleteAction: async () => ({}),
    initialValues: {
      type: "balance_adjustment",
      accountId: "account",
      accountName: "现金",
      currency: "JPY",
      signedDelta: "2500",
      transactionRecordId: "record",
      transactionAt: "2026-09-14T00:00:00Z",
      note: "盘点",
      accountArchived: false,
    },
  },
} satisfies Meta<typeof BalanceAdjustmentEditForm>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Increase: Story = { name: "正向调整" };
export const Decrease: Story = {
  name: "负向调整",
  args: { initialValues: { ...meta.args.initialValues, signedDelta: "-2500" } },
};
export const Archived: Story = {
  name: "归档账户",
  args: {
    initialValues: { ...meta.args.initialValues, accountArchived: true },
  },
};
