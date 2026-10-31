import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import {
  accountHolderOptionsFixture,
  accountPlaceholderHolderOptionsFixture,
} from "test/mocks/accountHolders";

import { AccountForm } from "./AccountForm";

const meta = {
  component: AccountForm,
  title: "Organisms/Accounts/AccountForm",
  args: {
    action: async () => {},
    defaultCurrency: "JPY",
    holderOptions: accountHolderOptionsFixture,
    placeholderHolderOptions: accountPlaceholderHolderOptionsFixture,
  },
} satisfies Meta<typeof AccountForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { name: "初始状态" };

export const Pending: Story = { name: "提交中", args: { pending: true } };

export const NoHolderOptions: Story = {
  name: "无可选持有人",
  args: { holderOptions: [], placeholderHolderOptions: [] },
};
