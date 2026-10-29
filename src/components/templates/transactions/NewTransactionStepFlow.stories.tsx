import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { transactionEntryStoryDecorators } from "organisms/transactions/transactionStepFlowStoryUtils";
import { itemsStepFixture } from "test/mocks/transactionItemsStep";
import { flowFixture } from "test/mocks/transactionStepFlow";
import { NewTransactionStepFlow } from "./NewTransactionStepFlow";

// Storybook 没有推荐查询 API：选商家后的建议按读取失败处理（按没有记录）。
const meta = {
  title: "Templates/Transactions/NewTransactionStepFlow",
  component: NewTransactionStepFlow,
  decorators: transactionEntryStoryDecorators,
  args: {
    action: async () => ({}),
    accountOptions: flowFixture.accounts,
    addPresetsAction: async () => ({}),
    categoryOptions: itemsStepFixture.categoryOptions,
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

export const Default: Story = { name: "从商家记账" };

export const NoFrequentMerchants: Story = {
  name: "常用商家为空（含获取失败）",
  args: { frequentMerchants: [] },
};

export const ReturnFromNewMerchant: Story = {
  name: "新建商家后返回（停在账户步骤）",
  args: { initialMerchantId: "life", initialStep: 2 },
};

export const ReturnFromNewAccount: Story = {
  name: "新建账户后返回（停在明细步骤）",
  args: { initialAccountId: "cash", initialMerchantId: "life", initialStep: 3 },
};
