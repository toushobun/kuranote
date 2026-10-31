import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import {
  accountHolderOptionsFixture,
  accountPlaceholderHolderOptionsFixture,
} from "test/mocks/accountHolders";

import { AccountCreateTemplate } from "./AccountCreate";

const meta = {
  title: "Templates/Accounts/AccountCreateTemplate",
  component: AccountCreateTemplate,
  args: {
    baseCurrency: "JPY",
    createAccountAction: async () => ({}),
    holderOptions: accountHolderOptionsFixture,
    ledgerName: "家庭账本",
    placeholderHolderOptions: accountPlaceholderHolderOptionsFixture,
  },
} satisfies Meta<typeof AccountCreateTemplate>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { name: "新增账户页面" };

export const FromTransaction: Story = {
  name: "从记一笔进入",
  args: { returnTo: "/transactions/new?method=transfer" },
};
