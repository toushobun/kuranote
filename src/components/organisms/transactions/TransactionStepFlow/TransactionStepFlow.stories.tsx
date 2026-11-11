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

async function selectMerchant(canvasElement: HTMLElement, name: string) {
  const body = await openMerchantStoryDrawer(canvasElement);
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

export const ChangeMerchantLoading: Story = {
  name: "换商家：明细读取中，已选账户照常添加",
  args: {
    suggestionsMerchantId: "seven",
    suggestions: { ...receiptSuggestions, recommendedAccountIds: ["paypay"] },
  },
  play: async ({ canvasElement }) => {
    const body = await selectMerchant(canvasElement, "7-Eleven");
    await body.findByRole("button", { name: "修改明细 1 金额：待输入" });
    await userEvent.click(body.getByRole("button", { name: "修改商家：7-Eleven" }));
    await userEvent.click(await body.findByRole("button", { name: "LIFE超市" }));
    const row = await body.findByText("正在按习惯准备明细…");
    await expect(row.closest('[role="status"]')).toBeVisible();
    await expect(
      body.queryByRole("button", { name: "添加明细" }),
    ).not.toBeInTheDocument();
    await expect(body.queryByText("正在读取常用账户…")).not.toBeInTheDocument();
    await expect(
      body.getByRole("button", { name: "添加付款账户" }),
    ).toBeInTheDocument();
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

export const CloseConfirmation: Story = {
  name: "小票关闭的公共确认",
  args: QuickEntry.args,
  play: async ({ canvasElement }) => {
    const body = await selectMerchant(canvasElement, "7-Eleven");
    await userEvent.click(body.getByRole("button", { name: /^修改备注：/ }));
    await userEvent.type(
      body.getByRole("textbox", { name: "备注" }),
      "手动添加备注",
    );
    await userEvent.click(body.getByRole("button", { name: "完成" }));
    await userEvent.click(
      await body.findByRole("button", { name: "关闭记账" }),
    );
    await expect(
      await body.findByRole("dialog", { name: "尚未保存" }),
    ).toBeVisible();
  },
};
