import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import {
  accountHolderOptionsFixture,
  accountPlaceholderHolderOptionsFixture,
  createPlaceholderAccountHolder,
} from "test/mocks/accountHolders";
import { bankAccountFixture } from "test/mocks/accounts";

import { AccountEditTemplate } from "./AccountEdit";

const meta = {
  title: "Templates/Accounts/AccountEditTemplate",
  component: AccountEditTemplate,
  args: {
    account: bankAccountFixture,
    archiveAccountAction: async () => ({}),
    baseCurrency: "JPY",
    holderOptions: accountHolderOptionsFixture,
    ledgerName: "家庭账本",
    placeholderHolderOptions: accountPlaceholderHolderOptionsFixture,
    updateAccountAction: async () => ({}),
  },
} satisfies Meta<typeof AccountEditTemplate>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { name: "编辑账户页面" };

export const CreditCardWithTransactions: Story = {
  name: "已有交易的信用卡（币种锁定）",
  args: {
    account: {
      ...bankAccountFixture,
      current_balance: -12800,
      has_transactions: true,
      holders: [createPlaceholderAccountHolder()],
      name: "楽天カード",
      type: "credit_card",
    },
  },
};
