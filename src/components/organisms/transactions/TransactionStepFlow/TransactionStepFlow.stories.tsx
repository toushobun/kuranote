import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, waitFor } from "storybook/test";
import {
  transactionEntryStoryDecorators,
  openMerchantStoryDrawer,
  receiptCreationStoryDecorator,
  expectSuggestionLoadingRows,
} from "organisms/transactions/transactionStepFlowStoryUtils";
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
  name: "打开即空小票",
};

async function selectMerchant(
  canvasElement: HTMLElement,
  name: string,
  currentMerchant?: string,
) {
  const body = await openMerchantStoryDrawer(canvasElement, currentMerchant);
  await userEvent.click(await body.findByRole("button", { name }));
  await body.findByRole("button", { name: `修改商家：${name}` });
  return body;
}

export const QuickEntry: Story = {
  name: "快速路线（建议到达后自动带出，明细待输入）",
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
  name: "第一次去的商家（不自动选账户）",
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
      expect(
        body.getByRole("button", { name: "添加付款账户" }),
      ).toBeInTheDocument(),
    );
  },
};

export const QuickEntryLoading: Story = {
  name: "快速路线（读取建议中，明细与付款区显示状态行）",
  args: { suggestionsMerchantId: "coffee" },
  play: async ({ canvasElement }) => {
    await selectMerchant(canvasElement, "7-Eleven");
    await expectSuggestionLoadingRows(canvasElement);
  },
};

async function selectMerchantWithSuggestions(canvasElement: HTMLElement) {
  const body = await selectMerchant(canvasElement, "7-Eleven");
  await body.findByRole("button", { name: "修改明细 1 金额：待输入" });
  return body;
}

export const ChangeMerchantLoading: Story = {
  name: "换商家：清空自动内容后读取明细和付款账户",
  args: QuickEntry.args,
  play: async ({ canvasElement }) => {
    const body = await selectMerchantWithSuggestions(canvasElement);
    await selectMerchant(canvasElement, "LIFE超市", "7-Eleven");
    await expectSuggestionLoadingRows(canvasElement);
    await expect(
      body.queryByRole("button", { name: "编辑明细 1" }),
    ).not.toBeInTheDocument();
    await expect(
      body.queryByRole("button", { name: "更换支付账户 1" }),
    ).not.toBeInTheDocument();
  },
};

export const ChangeMerchantAfterEdit: Story = {
  name: "动过小票后换商家不读取",
  args: QuickEntry.args,
  play: async ({ canvasElement }) => {
    const body = await selectMerchantWithSuggestions(canvasElement);
    await addReceiptNote(body);
    await selectMerchant(canvasElement, "LIFE超市", "7-Eleven");
    await expect(body.getByRole("button", { name: "添加明细" })).toBeVisible();
    await expect(
      body.getByRole("button", { name: "添加付款账户" }),
    ).toBeVisible();
    await expect(
      body.getByRole("button", { name: "编辑明细 1" }),
    ).toBeVisible();
    await expect(body.getByText("PayPay", { exact: true })).toBeVisible();
    await expect(
      body.getByRole("button", { name: "修改备注：手动添加备注" }),
    ).toBeVisible();
  },
};

export const ChangeMerchant: Story = {
  name: "小票商家抽屉（已填内容保留）",
  decorators: [receiptCreationStoryDecorator],
  args: {
    itemsOptions: {
      ...receiptItemsOptions,
      initialItems: [{ categoryId: "lunch", amount: "498" }],
      initialPayments: [{ accountId: "paypay", amount: null }],
    },
  },
  play: async ({ canvasElement }) => {
    const body = await selectMerchant(canvasElement, "7-Eleven");
    await userEvent.click(
      body.getByRole("button", { name: "修改商家：7-Eleven" }),
    );
  },
};

async function addReceiptNote(
  body: Awaited<ReturnType<typeof selectMerchant>>,
) {
  await userEvent.click(body.getByRole("button", { name: /^修改备注：/ }));
  await userEvent.type(
    body.getByRole("textbox", { name: "备注" }),
    "手动添加备注",
  );
  await userEvent.click(body.getByRole("button", { name: "完成" }));
}

export const CloseConfirmation: Story = {
  name: "小票关闭的公共确认",
  args: QuickEntry.args,
  play: async ({ canvasElement }) => {
    const body = await selectMerchant(canvasElement, "7-Eleven");
    await addReceiptNote(body);
    await userEvent.click(
      await body.findByRole("button", { name: "关闭记账" }),
    );
    await expect(
      await body.findByRole("dialog", { name: "尚未保存" }),
    ).toBeVisible();
  },
};
