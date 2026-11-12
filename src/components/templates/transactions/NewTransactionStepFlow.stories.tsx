import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import {
  transactionEntryStoryDecorators,
  openMerchantStoryDrawer,
  receiptCreationStoryDecorator,
} from "organisms/transactions/transactionStepFlowStoryUtils";
import { receiptItemsOptions } from "test/mocks/transactionReceipt";
import { flowFixture } from "test/mocks/transactionStepFlow";
import { NewTransactionStepFlow } from "./NewTransactionStepFlow";

// Storybook 没有推荐查询 API：选商家后的建议按读取失败处理（按没有记录）。
const meta = {
  title: "Templates/Transactions/NewTransactionStepFlow",
  component: NewTransactionStepFlow,
  decorators: [
    ...transactionEntryStoryDecorators,
    receiptCreationStoryDecorator,
  ],
  args: {
    action: async () => ({}),
    accountOptions: flowFixture.accounts,
    addPresetsAction: async () => ({}),
    categoryOptions: receiptItemsOptions.categoryOptions,
    frequentMerchants: flowFixture.frequentMerchants,
    ledgerId: "ledger-1",
    loadPresetsAction: async () => ({}),
    merchantOptions: flowFixture.merchants,
    merchantTags: flowFixture.merchantTags,
    multiAccountPaymentEnabled: true,
    transactionItemSpecialStatusEnabled: false,
  },
  parameters: { viewport: { defaultViewport: "mobile2" } },
} satisfies Meta<typeof NewTransactionStepFlow>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { name: "从商家记账（打开即空小票）" };

export const NoFrequentMerchants: Story = {
  name: "常用商家为空（含获取失败）",
  args: { frequentMerchants: [] },
  play: async ({ canvasElement }) => {
    await openMerchantStoryDrawer(canvasElement);
  },
};

export const NewMerchantWithoutHistory: Story = {
  name: "无记录商家（直接显示空小票）",
  play: async ({ canvasElement }) => {
    const body = await openMerchantStoryDrawer(canvasElement);
    await userEvent.click(await body.findByRole("button", { name: "新开商家" }));
    const addItem = await body.findByRole("button", { name: "添加明细" });
    const itemsLoading = body.queryByText("正在按习惯准备明细…");
    const paymentsLoading = body.queryByText("正在读取常用账户…");
    await expect(addItem).toBeVisible();
    await expect(itemsLoading).not.toBeInTheDocument();
    await expect(paymentsLoading).not.toBeInTheDocument();
  },
};

export const Transfer: Story = {
  name: "账户周转（同一外框，可切回从商家记账）",
  args: { initialMethod: "transfer" },
};

export const RetainedDrafts: Story = {
  name: "切换方式后保留草稿",
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    const click = async (name: string) =>
      userEvent.click(await body.findByRole("button", { name }));
    await click("修改备注：添加备注");
    await userEvent.type(
      await body.findByRole("textbox", { name: "备注" }),
      "周末采购",
    );
    await click("完成");
    await click("切换方式");
    await click("账户周转");
    await click("切换方式");
    await click("从商家记账");
    await expect(
      await body.findByRole("button", { name: "修改备注：周末采购" }),
    ).toBeVisible();
  },
};
