import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { receiptSuggestions } from "test/mocks/transactionReceipt";
import { TransactionItemAmountDrawer } from "./TransactionItemAmountDrawer";
const meta = {
  title: "Organisms/Transactions/TransactionItemAmountDrawer",
  component: TransactionItemAmountDrawer,
  args: {
    open: true,
    title: "餐饮 · 午餐",
    categoryId: "lunch",
    currency: "JPY",
    value: "",
    quickAmounts: receiptSuggestions.quickAmounts,
    onConfirm: () => {},
    onClose: () => {},
  },
} satisfies Meta<typeof TransactionItemAmountDrawer>;
export default meta;
type Story = StoryObj<typeof meta>;
export const QuickAmounts: Story = { name: "上次与常用金额" };
export const NoQuickAmounts: Story = {
  name: "没有对应快捷金额",
  args: { quickAmounts: [] },
};
export const Cny: Story = { name: "人民币小数精度", args: { currency: "CNY" } };
