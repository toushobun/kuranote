import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  transactionEntryStoryDecorators,
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

export const Default: Story = { name: "从商家记账" };

export const NoFrequentMerchants: Story = {
  name: "常用商家为空（含获取失败）",
  args: { frequentMerchants: [] },
};
