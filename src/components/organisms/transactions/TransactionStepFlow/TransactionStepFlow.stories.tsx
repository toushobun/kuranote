import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { transactionEntryStoryDecorators } from "organisms/transactions/transactionStepFlowStoryUtils";
import {
  receiptItemsOptions,
  receiptSuggestions,
} from "test/mocks/transactionReceipt";
import { flowFixture } from "test/mocks/transactionStepFlow";
import { TransactionStepFlow } from "./TransactionStepFlow";
const meta = {
  title: "Organisms/Transactions/TransactionStepFlow",
  component: TransactionStepFlow,
  decorators: transactionEntryStoryDecorators,
  args: { ...flowFixture, itemsOptions: receiptItemsOptions },
  parameters: { viewport: { defaultViewport: "mobile2" } },
} satisfies Meta<typeof TransactionStepFlow>;
export default meta;
type Story = StoryObj<typeof meta>;
export const MerchantDefault: Story = {
  name: "选择商家（常用不足八个）",
};

async function selectMerchant(canvasElement: HTMLElement, name: string) {
  const body = within(canvasElement.ownerDocument.body);
  await userEvent.click(body.getByRole("button", { name }));
  return body;
}

export const QuickEntry: Story = {
  name: "快速路线（建议到达后进入小票，自动明细待输入）",
  args: {
    suggestionsMerchantId: "seven",
    suggestions: { ...receiptSuggestions, recommendedAccountIds: ["paypay"] },
  },
  play: async ({ canvasElement }) => {
    const body = await selectMerchant(canvasElement, "7-Eleven");
    // 进入小票后不自动弹出金额键盘，自动明细显示「待输入」。
    await waitFor(() =>
      expect(
        body.getByRole("button", { name: "修改明细 1 金额：待输入" }),
      ).toBeInTheDocument(),
    );
    await expect(body.queryByLabelText("金额计算器")).not.toBeInTheDocument();
  },
};

export const FirstVisit: Story = {
  name: "第一次去的商家（不选账户，进入小票）",
  args: {
    suggestionsMerchantId: "coffee",
    suggestions: {
      automaticCategoryIds: [],
      quickAmounts: [],
      recommendedAccountIds: [],
    },
  },
  play: async ({ canvasElement }) => {
    const body = await selectMerchant(canvasElement, "星巴克");
    await waitFor(() =>
      expect(body.getByText("这家商家还没有记录")).toBeInTheDocument(),
    );
  },
};

export const QuickEntryLoading: Story = {
  name: "快速路线（读取建议中，超时后进入小票）",
  args: { suggestionsMerchantId: "coffee" },
  play: async ({ canvasElement }) => {
    await selectMerchant(canvasElement, "7-Eleven");
  },
};

export const BackToMerchant: Story = {
  name: "小票返回选择商家（已填内容保留）",
  args: {
    initialMerchantId: "seven",
    initialAccountId: "paypay",
    itemsOptions: {
      ...receiptItemsOptions,
      initialItems: [{ categoryId: "lunch", amount: "498" }],
    },
  },
  play: async ({ canvasElement }) => {
    await selectMerchant(canvasElement, "返回选择商家");
  },
};

export const CloseConfirmation: Story = {
  name: "关闭确认",
  play: async ({ canvasElement }) => {
    await selectMerchant(canvasElement, "关闭记账");
  },
};
