import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { userEvent, within } from "storybook/test";
import { transactionEntryStoryDecorators } from "organisms/transactions/transactionStepFlowStoryUtils";
import {
  itemsStepFixture,
  filledItems,
  twoPayments,
} from "test/mocks/transactionItemsStep";
import { TransactionItemsStep } from "./TransactionItemsStep";
const meta = {
  title: "Organisms/Transactions/TransactionItemsStep",
  component: TransactionItemsStep,
  decorators: transactionEntryStoryDecorators,
  args: itemsStepFixture,
} satisfies Meta<typeof TransactionItemsStep>;
export default meta;
type Story = StoryObj<typeof meta>;
export const NoHistory: Story = {
  name: "04-没有常用明细",
  args: { merchantHasHistory: false },
};
export const Empty: Story = { name: "04-有记录但没有自动明细" };
export const Automatic: Story = {
  name: "04-有自动添加的明细",
  args: { prefillAutomaticItems: true },
};
export const CategoryPicker: Story = {
  name: "04-选择分类（无金额、无常用快捷）",
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement.ownerDocument.body).getByRole("button", {
        name: "添加明细",
      }),
    );
  },
};
export const MultipleItems: Story = {
  name: "04-多条明细含待报销及收入",
  args: {
    initialItems: [
      {
        categoryId: "lunch",
        amount: "520",
        specialStatus: "pendingReimbursement",
      },
      { categoryId: "coffee", amount: "480" },
      { categoryId: "points", amount: "50" },
    ],
  },
};
export const SinglePayment: Story = {
  name: "05-单账户付款",
  args: { initialItems: filledItems },
};
export const UnbalancedPayments: Story = {
  name: "05-两个账户未对上",
  args: {
    initialItems: filledItems,
    initialPayments: [
      { accountId: "paypay", amount: "7000" },
      { accountId: "cash", amount: "0" },
    ],
  },
};
export const BalancedPayments: Story = {
  name: "05-两个账户已对上",
  args: { initialItems: filledItems, initialPayments: twoPayments },
};
export const AmountKeypad: Story = {
  name: "00B-金额键盘与快捷金额",
  args: Automatic.args,
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement.ownerDocument.body).getByRole("button", {
        name: "编辑明细 1 金额",
      }),
    );
  },
};
