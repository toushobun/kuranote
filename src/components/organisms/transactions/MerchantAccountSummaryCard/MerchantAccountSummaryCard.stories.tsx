import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { summaryCardFixture } from "test/mocks/transactionStepFlow";
import { MerchantAccountSummaryCard } from "./MerchantAccountSummaryCard";
const meta = {
  title: "Organisms/Transactions/MerchantAccountSummaryCard",
  component: MerchantAccountSummaryCard,
  args: summaryCardFixture,
} satisfies Meta<typeof MerchantAccountSummaryCard>;
export default meta;
type Story = StoryObj<typeof meta>;
export const MerchantOnly: Story = {
  name: "只选商家",
  args: { account: undefined },
};
export const MerchantAndAccount: Story = { name: "已选商家与账户" };

export const MultipleAccounts: Story = {
  name: "多个付款账户（不可更换）",
  args: { paymentAccountCount: 2 },
};
