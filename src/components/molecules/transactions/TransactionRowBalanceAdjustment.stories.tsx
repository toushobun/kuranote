import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TransactionRow } from "./TransactionRow";
const meta = {
  component: TransactionRow,
  title: "Molecules/Transactions/BalanceAdjustmentRow",
  args: {
    item: {
      id: "adjustment",
      type: "balance_adjustment",
      amount: "2500",
      account_name: "现金",
      account_currency: "JPY",
      transaction_at: "2026-09-14T00:00:00Z",
      recorder_name: "淞文",
      merchant_name: null,
      merchant_icon_url: null,
      categoryItems: [],
      note: "余额盘点",
    },
  },
} satisfies Meta<typeof TransactionRow>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Increase: Story = { name: "余额增加" };
export const Decrease: Story = {
  name: "余额减少",
  args: { item: { ...meta.args.item, amount: "-2500" } },
};
