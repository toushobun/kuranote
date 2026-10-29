import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { userEvent, within } from "storybook/test";
import { TransactionStepFlow } from "../TransactionStepFlow/TransactionStepFlow";
import { transactionEntryStoryDecorators } from "organisms/transactions/transactionStepFlowStoryUtils";
import { flowFixture } from "test/mocks/transactionStepFlow";
import {
  receiptFlowFixture,
  receiptItemsOptions,
  receiptSuggestions,
  twoPayments,
} from "test/mocks/transactionReceipt";
const meta = {
  title: "Organisms/Transactions/TransactionConfirmStep",
  component: TransactionStepFlow,
  decorators: transactionEntryStoryDecorators,
  args: { ...flowFixture, ...receiptFlowFixture },
  parameters: { viewport: { defaultViewport: "mobile2" } },
} satisfies Meta<typeof TransactionStepFlow>;
export default meta;
type Story = StoryObj<typeof meta>;

function clickButton(canvasElement: HTMLElement, name: string | RegExp) {
  return userEvent.click(
    within(canvasElement.ownerDocument.body).getByRole("button", { name }),
  );
}

export const QuickEntry: Story = {
  name: "快速路线：自动明细待输入（设计图 8 ②）",
  args: {
    initialAccountId: undefined,
    suggestionsMerchantId: "seven",
    suggestions: { ...receiptSuggestions, recommendedAccountIds: ["paypay"] },
    itemsOptions: receiptItemsOptions,
  },
};
export const FirstVisit: Story = {
  name: "第一次去的商家：选择收支账户（设计图 8 ③）",
  args: {
    initialMerchantId: "coffee",
    initialAccountId: undefined,
    suggestionsMerchantId: "coffee",
    suggestions: {
      automaticCategoryIds: [],
      quickAmounts: [],
      recommendedAccountIds: [],
    },
    itemsOptions: receiptItemsOptions,
  },
};
export const MultiAccountBalanced: Story = {
  name: "多账户已对上（设计图 8 ④）",
  args: {
    initialMerchantId: "life",
    itemsOptions: {
      ...receiptItemsOptions,
      initialItems: [
        { categoryId: "lunch", amount: "8000" },
        { categoryId: "storage", amount: "2000" },
      ],
      initialPayments: twoPayments,
    },
  },
};
export const MultiAccountUnbalanced: Story = {
  name: "多账户未对上（差额、禁用保存）",
  args: {
    ...MultiAccountBalanced.args,
    itemsOptions: {
      ...receiptItemsOptions,
      initialItems: [
        { categoryId: "lunch", amount: "8000" },
        { categoryId: "storage", amount: "1500" },
      ],
      initialPayments: twoPayments,
    },
  },
};
export const SingleAccount: Story = { name: "单账户（已填金额、空备注）" };
export const ItemTags: Story = {
  name: "明细标签（自动以外的待报销）",
  args: {
    itemsOptions: {
      ...receiptItemsOptions,
      initialItems: [
        {
          categoryId: "lunch",
          amount: "1200",
          specialStatus: "pendingReimbursement",
        },
        { categoryId: "points", amount: "100" },
      ],
    },
  },
};
export const AccountPicker: Story = {
  name: "支付行铅笔：账户选择抽屉",
  play: ({ canvasElement }) => clickButton(canvasElement, "更换支付账户 1"),
};
export const PaymentAmountKeypad: Story = {
  name: "多账户：点金额打开金额键盘",
  args: MultiAccountUnbalanced.args,
  play: ({ canvasElement }) =>
    clickButton(canvasElement, /^修改支付账户 2 金额：/),
};
export const NoteEditor: Story = {
  name: "编辑备注",
  play: async ({ canvasElement }) => {
    await clickButton(canvasElement, /^修改备注：/);
    await userEvent.type(
      within(canvasElement.ownerDocument.body).getByRole("textbox", {
        name: "备注",
      }),
      "和同事一起吃的午饭",
    );
  },
};
export const TimeEditor: Story = {
  name: "编辑时间（日期展开、时刻保留秒）",
  play: ({ canvasElement }) => clickButton(canvasElement, /^修改时间：/),
};
export const SaveError: Story = {
  name: "保存失败",
  args: { action: async () => ({ error: "保存失败，请稍后重试。" }) },
  play: ({ canvasElement }) => clickButton(canvasElement, "保存记账"),
};
export const Saving: Story = {
  name: "保存中",
  args: { action: async () => new Promise(() => {}) },
  play: SaveError.play,
};
export const Abandon: Story = {
  name: "小票关闭时确认",
  play: ({ canvasElement }) => clickButton(canvasElement, "关闭记账"),
};
