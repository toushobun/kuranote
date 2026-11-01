import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { TransactionStepFlow } from "../TransactionStepFlow/TransactionStepFlow";
import { transactionEntryStoryDecorators } from "organisms/transactions/transactionStepFlowStoryUtils";
import { flowFixture } from "test/mocks/transactionStepFlow";
import { ReadOnlyReceipt } from "test/ReadOnlyReceipt";
import {
  receiptFlowFixture,
  receiptEmojiItemsOptions as receiptItemsOptions,
  receiptSuggestions,
  twoPayments,
} from "test/mocks/transactionReceipt";
const meta = {
  title: "Organisms/Transactions/TransactionConfirmStep",
  component: TransactionStepFlow,
  decorators: transactionEntryStoryDecorators,
  args: {
    ...flowFixture,
    ...receiptFlowFixture,
    itemsOptions: {
      ...receiptFlowFixture.itemsOptions,
      ...receiptItemsOptions,
    },
  },
  render: (args) => (
    <TransactionStepFlow
      {...args}
      itemsOptions={{
        ...args.itemsOptions,
        categoryOptions: args.itemsOptions?.categoryOptions ?? [],
        initialPayments:
          args.itemsOptions?.initialPayments ??
          receiptFlowFixture.itemsOptions?.initialPayments,
      }}
    />
  ),
  play: ({ canvasElement }) => enterReceipt(canvasElement),
  parameters: { viewport: { defaultViewport: "mobile2" } },
} satisfies Meta<typeof TransactionStepFlow>;
export default meta;
type Story = StoryObj<typeof meta>;

async function enterReceipt(canvasElement: HTMLElement, merchant = "7-Eleven") {
  const body = within(canvasElement.ownerDocument.body);
  if (body.queryByRole("textbox", { name: "搜索商家" })) {
    await userEvent.click(body.getByRole("button", { name: merchant }));
    await body.findByRole("button", { name: "更换支付账户 1" });
  }
}
async function clickButton(canvasElement: HTMLElement, name: string | RegExp) {
  await enterReceipt(canvasElement);
  return userEvent.click(
    within(canvasElement.ownerDocument.body).getByRole("button", { name }),
  );
}

export const QuickEntry: Story = {
  name: "快速路线：自动明细待输入（设计图 8 ②）",
  args: {
    suggestionsMerchantId: "seven",
    suggestions: { ...receiptSuggestions, recommendedAccountIds: ["paypay"] },
    itemsOptions: receiptItemsOptions,
  },
};
export const FirstVisit: Story = {
  play: ({ canvasElement }) => enterReceipt(canvasElement, "星巴克"),
  name: "第一次去的商家：选择收支账户（设计图 8 ③）",
  args: {
    suggestionsMerchantId: "coffee",
    suggestions: {
      automaticCategoryIds: [],
      quickAmounts: [],
      recommendedAccountIds: [],
    },
    itemsOptions: {
      ...receiptItemsOptions,
      initialPayments: [{ accountId: "", amount: null }],
    },
  },
};
export const MultiAccountBalanced: Story = {
  name: "多账户已对上（设计图 8 ④）",
  args: {
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
  name: "明细两排：首排名称与操作、次排待报销",
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
// 被其他记录退款 / 报销核销后的支出（编辑时，#962）。
const offsetItems = [
  {
    categoryId: "lunch",
    amount: "10000",
    businessNetAmount: "5000",
    refundedAmount: "3000",
    reimbursementAmount: "2000",
  },
];
export const OffsetNetTotal: Story = {
  name: "被其他记录退款 / 报销：合计显示净额与已退款、已报销",
  args: {
    itemsOptions: { ...receiptItemsOptions, initialItems: offsetItems },
  },
};
export const ReadOnly: Story = {
  name: "只读（#962）：没有铅笔、×、可点金额与保存按钮",
  render: () => (
    <ReadOnlyReceipt
      itemsOptions={{
        ...receiptItemsOptions,
        initialItems: [...offsetItems, { categoryId: "points", amount: "100" }],
      }}
      note="退了一部分，剩下的公司报销"
    />
  ),
};
export const AccountPicker: Story = {
  name: "支付行铅笔：账户选择抽屉",
  play: ({ canvasElement }) => clickButton(canvasElement, "更换支付账户 1"),
};
export const CurrencyConfirm: Story = {
  name: "换成不同币种的账户：确认框在抽屉之上",
  play: async ({ canvasElement }) => {
    await clickButton(canvasElement, "更换支付账户 1");
    await userEvent.click(
      await within(canvasElement.ownerDocument.body).findByRole("radio", {
        name: "招商银行卡 CNY",
      }),
    );
  },
};
export const ExcessDecimals: Story = {
  name: "明细两排：首排真实金额、次排小数位超出提示",
  args: {
    itemsOptions: {
      ...receiptItemsOptions,
      // ฿12.55 换成 JPY 账户后金额不换算，保留 12.55。
      initialItems: [
        { categoryId: "lunch", amount: "12.55" },
        { categoryId: "storage", amount: "2000" },
      ],
    },
  },
};
export const PaymentAmountKeypad: Story = {
  name: "多账户：点金额打开金额键盘（输入中小票金额不变）",
  args: MultiAccountUnbalanced.args,
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    await clickButton(canvasElement, "修改支付账户 2 金额：¥3,000");
    const keypad = await body.findByLabelText("金额计算器");
    await userEvent.click(within(keypad).getByRole("button", { name: "清空" }));
    await userEvent.click(within(keypad).getByRole("button", { name: "5" }));
    // 键盘里只是草稿，点「确定」前小票上的金额不变。
    await expect(
      body.getByRole("button", {
        name: "修改支付账户 2 金额：¥3,000",
        hidden: true,
      }),
    ).toBeInTheDocument();
  },
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
