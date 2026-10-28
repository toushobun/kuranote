import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { userEvent, within } from "storybook/test";
import { transactionEntryStoryDecorators } from "organisms/transactions/transactionStepFlowStoryUtils";
import {
  itemsStepFixture,
  filledItems,
  twoPayments,
} from "test/mocks/transactionItemsStep";
import { flowFixture } from "test/mocks/transactionStepFlow";
import { TransactionStepFlow } from "./TransactionStepFlow";
const meta = {
  title: "Organisms/Transactions/TransactionStepFlow",
  component: TransactionStepFlow,
  decorators: transactionEntryStoryDecorators,
  args: flowFixture,
  parameters: { viewport: { defaultViewport: "mobile2" } },
} satisfies Meta<typeof TransactionStepFlow>;
export default meta;
type Story = StoryObj<typeof meta>;
export const MerchantDefault: Story = { name: "商家默认（常用不足八个）" };

export const RecommendedAccounts: Story = {
  name: "收支账户有推荐",
  args: {
    initialStep: 2,
    initialMerchantId: "seven",
  },
};

export const ReturnFromConfirmation: Story = {
  name: "从确认页返回修改",
  args: {
    initialStep: 4,
    initialMerchantId: "seven",
    initialAccountId: "paypay",
  },
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement.ownerDocument.body).getByRole("button", {
        name: "账户",
      }),
    );
  },
};

export const CloseConfirmation: Story = {
  name: "关闭确认",
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement.ownerDocument.body).getByRole("button", {
        name: "关闭记账",
      }),
    );
  },
};

export const ItemsStep: Story = {
  name: "明细步骤（自动预填）",
  args: {
    initialStep: 3,
    initialMerchantId: "seven",
    initialAccountId: "paypay",
    suggestions: itemsStepFixture.suggestions,
    itemsOptions: { ...itemsStepFixture, prefillAutomaticItems: true },
  },
};
export const SharedPayments: Story = {
  name: "明细步骤（多账户付款）",
  args: {
    ...ItemsStep.args,
    itemsOptions: {
      ...itemsStepFixture,
      initialItems: filledItems,
      initialPayments: twoPayments,
    },
  },
};

export const QuickEntry: Story = {
  name: "快速路线（确认页自动弹出金额键盘）",
  args: {
    suggestionsMerchantId: "seven",
    suggestions: {
      ...itemsStepFixture.suggestions!,
      recommendedAccountIds: ["paypay"],
    },
    itemsOptions: { categoryOptions: itemsStepFixture.categoryOptions },
  },
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement.ownerDocument.body).getByRole("button", {
        name: "7-Eleven",
      }),
    );
  },
};
