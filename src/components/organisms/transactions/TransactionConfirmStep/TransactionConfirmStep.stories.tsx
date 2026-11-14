import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { TransactionStepFlow } from "../TransactionStepFlow/TransactionStepFlow";
import {
  openMerchantStoryDrawer,
  transactionEntryStoryDecorators,
  expectSuggestionLoadingRows,
} from "organisms/transactions/transactionStepFlowStoryUtils";
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
const unselectedAccountItemsOptions = {
  ...receiptItemsOptions,
  initialPayments: [{ accountId: "", amount: null }],
};

async function enterReceipt(canvasElement: HTMLElement, merchant = "7-Eleven") {
  const body = within(canvasElement.ownerDocument.body);
  if (body.queryByRole("button", { name: "修改商家：请选择商家" })) {
    await openMerchantStoryDrawer(canvasElement);
    await userEvent.click(body.getByRole("button", { name: merchant }));
    await body.findByRole("button", { name: "保存记账" });
  }
}
async function clickButton(canvasElement: HTMLElement, name: string | RegExp) {
  await enterReceipt(canvasElement);
  return userEvent.click(
    within(canvasElement.ownerDocument.body).getByRole("button", { name }),
  );
}

export const SuggestionsLoading: Story = {
  name: "首次选商家：明细与付款账户读取中",
  args: {
    itemsOptions: {
      ...unselectedAccountItemsOptions,
      initialItems: [],
    },
    suggestionsMerchantId: "coffee",
    suggestions: undefined,
  },
  play: async ({ canvasElement }) => {
    await enterReceipt(canvasElement);
    await expectSuggestionLoadingRows(canvasElement);
  },
};

export const QuickEntry: Story = {
  name: "自动明细待输入：名称与金额各有铅笔",
  args: {
    suggestionsMerchantId: "seven",
    suggestions: { ...receiptSuggestions, recommendedAccountIds: ["paypay"] },
    itemsOptions: receiptItemsOptions,
  },
};
const pendingRefundOptions = {
  ...receiptItemsOptions,
  initialItems: [],
  categoryOptions: [
    ...receiptItemsOptions.categoryOptions,
    {
      id: "refund-system",
      name: "退款",
      parentId: "special-income",
      parentName: "特殊收入",
      systemKey: "refund" as const,
      type: "income" as const,
    },
  ],
};

export const AutomaticRefundPending: Story = {
  name: "自动带出退款：未选择原支出",
  args: {
    itemsOptions: pendingRefundOptions,
    suggestionsMerchantId: "seven",
    suggestions: {
      automaticCategoryIds: ["refund-system"],
      recommendedAccountIds: ["paypay"],
      quickAmounts: [],
    },
  },
  play: async ({ canvasElement }) => {
    await enterReceipt(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    await expect(
      await body.findByRole("button", { name: "第1条退款明细：选择原支出" }),
    ).toBeVisible();
    await expect(body.getByText("还没选原支出")).toBeVisible();
  },
};

export const AutomaticRefundPendingAfterSave: Story = {
  name: "自动带出退款：未选原支出点保存后",
  args: AutomaticRefundPending.args,
  play: async ({ canvasElement }) => {
    await enterReceipt(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    await body.findByRole("button", { name: "第1条退款明细：选择原支出" });
    await userEvent.click(body.getByRole("button", { name: "保存记账" }));
    await expect(
      body.getByRole("button", { name: "请为退款明细选择原支出" }),
    ).toBeVisible();
  },
};

export const AutomaticAccountOnly: Story = {
  name: "只自动选付款账户：显示自动添加提示",
  args: {
    ...QuickEntry.args,
    itemsOptions: unselectedAccountItemsOptions,
    suggestions: {
      automaticCategoryIds: [],
      quickAmounts: [],
      recommendedAccountIds: ["paypay"],
    },
  },
};
export const FirstVisit: Story = {
  play: ({ canvasElement }) => enterReceipt(canvasElement, "星巴克"),
  name: "第一次去的商家：添加付款账户",
  args: {
    suggestionsMerchantId: "coffee",
    suggestions: {
      automaticCategoryIds: [],
      quickAmounts: [],
      recommendedAccountIds: [],
    },
    itemsOptions: unselectedAccountItemsOptions,
  },
};
export const FirstVisitAfterSave: Story = {
  name: "第一次去的商家：尝试保存后显示校验提示",
  args: FirstVisit.args,
  play: async ({ canvasElement }) => {
    await enterReceipt(canvasElement, "星巴克");
    await userEvent.click(
      within(canvasElement.ownerDocument.body).getByRole("button", {
        name: "保存记账",
      }),
    );
  },
};
export const MultiAccountBalanced: Story = {
  name: "多账户已对上：可改账户与支付金额",
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
export const MultiAccountIncome: Story = {
  name: "纯收入：多账户收款已对上",
  args: {
    itemsOptions: {
      ...receiptItemsOptions,
      initialItems: [{ categoryId: "points", amount: "10000" }],
      initialPayments: twoPayments,
    },
  },
};
export const MultiAccountIncomeAddItem: Story = {
  ...MultiAccountIncome,
  name: "纯收入多账户：新增明细默认选中收入分类",
  play: async ({ canvasElement }) => {
    await clickButton(canvasElement, "添加明细");
    const body = within(canvasElement.ownerDocument.body);
    await expect(
      await body.findByRole("button", { name: /积分返还/, pressed: true }),
    ).toBeInTheDocument();
  },
};
export const AddItemGroupSwitch: Story = {
  ...MultiAccountBalanced,
  name: "新增明细：切换大分类后选中第一个小分类",
  play: async ({ canvasElement }) => {
    await clickButton(canvasElement, "添加明细");
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(await body.findByRole("button", { name: /日用品/ }));
    await expect(
      await body.findByRole("button", { name: /收纳/, pressed: true }),
    ).toBeInTheDocument();
  },
};
export const MixedPaymentHint: Story = {
  name: "收支混合：只允许一个账户",
  args: {
    itemsOptions: {
      ...receiptItemsOptions,
      initialItems: [
        { categoryId: "lunch", amount: "8000" },
        { categoryId: "points", amount: "100" },
      ],
    },
  },
};
export const MultiAccountAddPayment: Story = {
  name: "多账户：添加付款账户抽屉",
  args: {
    ...MultiAccountBalanced.args,
    suggestionsMerchantId: "seven",
    suggestions: {
      automaticCategoryIds: [],
      quickAmounts: [],
      recommendedAccountIds: ["paypay", "cash"],
    },
  },
  play: async ({ canvasElement }) => {
    await clickButton(canvasElement, "添加付款账户");
    const drawer = within(
      await within(canvasElement.ownerDocument.body).findByRole("radiogroup", {
        name: "收支账户",
      }),
    );
    await expect(
      drawer.getByRole("radio", { name: "乐天银行 JPY" }),
    ).toBeInTheDocument();
    await expect(drawer.queryByRole("alert")).not.toBeInTheDocument();
  },
};
export const MultiAccountUnbalanced: Story = {
  name: "多账户未对上（差额、保存时提示）",
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
export const SingleAccount: Story = { name: "单账户：支付金额为纯文字" };
export const GroupedCategories: Story = {
  name: "多组小计：长名称、大金额与仅大分类",
  args: {
    itemsOptions: {
      ...receiptItemsOptions,
      categoryOptions: [
        ...receiptItemsOptions.categoryOptions,
        {
          id: "personal-care",
          name: "🧴 洗护用品",
          parentId: "daily",
          parentName: "🛒 日用杂货",
          type: "expense",
        },
        {
          id: "gifts",
          name: "🎁 节日与人情往来礼品及伴手礼",
          parentId: "social",
          parentName: "🧧 人情往来",
          type: "expense",
        },
        {
          id: "food",
          name: "🍽️ 饮食",
          parentId: null,
          parentName: null,
          type: "expense",
        },
      ],
      initialItems: [
        { categoryId: "lunch", amount: "8000" },
        { categoryId: "personal-care", amount: "12345678" },
        { categoryId: "gifts", amount: "12345678" },
        { categoryId: "points", amount: "100" },
        { categoryId: "food", amount: "1200" },
      ],
    },
  },
};
export const SingleCategory: Story = {
  name: "单组无小计，未选分类的明细排在分组之后",
  args: {
    itemsOptions: {
      ...receiptItemsOptions,
      initialItems: [
        { categoryId: "", amount: "200" },
        { categoryId: "lunch", amount: "680" },
      ],
    },
  },
};
export const GroupedWithAutomaticNotice: Story = {
  name: "样式 ④：自动添加提示与多组间距（默认主题）",
  args: {
    ...QuickEntry.args,
    suggestions: {
      ...receiptSuggestions,
      automaticCategoryIds: ["lunch", "coffee", "points"],
      recommendedAccountIds: ["paypay"],
    },
    itemsOptions: {
      ...receiptItemsOptions,
      categoryOptions: receiptItemsOptions.categoryOptions.map((category) =>
        category.id === "coffee"
          ? { ...category, parentId: "food", parentName: "🍽️ 饮食" }
          : category,
      ),
    },
  },
};
export const GroupedWithAutomaticNoticeSakura: Story = {
  ...GroupedWithAutomaticNotice,
  name: "样式 ④：自动添加提示与多组间距（樱花主题）",
  parameters: { userTheme: { initialThemeKey: "sakuraStory" } },
};
export const ItemTags: Story = {
  name: "待报销明细与收支混合的单账户说明",
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
export const GroupedSublines: Story = {
  name: "样式 ④：组内与组末都有次排时的间距",
  args: {
    itemsOptions: {
      ...receiptItemsOptions,
      initialItems: [
        {
          categoryId: "lunch",
          amount: "1200",
          specialStatus: "pendingReimbursement",
        },
        { categoryId: "lunch", amount: "800" },
        { categoryId: "storage", amount: "12.55" },
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
export const AccountPickerAfterRemoval: Story = {
  name: "删除账户后重新选择：没有选中项",
  play: async ({ canvasElement }) => {
    await clickButton(canvasElement, "删除支付账户 1");
    await clickButton(canvasElement, "添加付款账户");
  },
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
  name: "编辑备注：自动聚焦且只显示抽屉标题",
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
  name: "小票修改后关闭确认（保存并退出）",
  play: async ({ canvasElement }) => {
    await clickButton(canvasElement, /^修改备注：/);
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.type(
      body.getByRole("textbox", { name: "备注" }),
      "临时备注",
    );
    await userEvent.click(body.getByRole("button", { name: "完成" }));
    await userEvent.click(
      await body.findByRole("button", { name: "关闭记账" }),
    );
  },
};

export const RefundReceiptWithSurplus: Story = {
  name: "退款小票 · 抵消支出与倒赚",
  args: {
    itemsOptions: {
      ...receiptItemsOptions,
      initialItems: [
        {
          amount: "1980",
          businessNetAmount: "1000",
          categoryId: "points",
          businessStatus: {
            incomeLinkRole: "refund",
            offsetComposition: { refundAmount: "0", reimbursementAmount: "0" },
            settlementStatus: null,
          },
        },
      ],
    },
  },
};
