import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { userEvent, within } from "storybook/test";
import { transactionEntryStoryDecorators } from "organisms/transactions/transactionStepFlowStoryUtils";
import {
  accountStepFixture,
  flowFixture,
} from "test/mocks/transactionStepFlow";
import { AccountStep } from "./AccountStep";
const meta = {
  title: "Organisms/Transactions/AccountStep",
  component: AccountStep,
  decorators: transactionEntryStoryDecorators,
  args: accountStepFixture,
  render: function AccountStepStory(args) {
    const [account, setAccount] = useState(args.selectedAccount);
    return (
      <AccountStep {...args} selectedAccount={account} onSelect={setAccount} />
    );
  },
} satisfies Meta<typeof AccountStep>;
export default meta;
type Story = StoryObj<typeof meta>;
export const RecommendedAccounts: Story = { name: "收支账户有推荐" };
export const NoHistory: Story = {
  name: "商家没有记录",
  args: { recommendedAccountIds: [] },
};
export const EmptyAccounts: Story = {
  name: "没有收支账户",
  args: { accounts: [] },
};
export const SelectedAccount: Story = {
  name: "已选账户",
  args: { selectedAccount: flowFixture.accounts[1] },
};
export const CurrencyConfirmation: Story = {
  name: "换币种确认",
  args: { ...SelectedAccount.args, hasDetails: true },
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement.ownerDocument.body).getByRole("radio", {
        name: "招商银行卡 CNY",
      }),
    );
  },
};
export const MultipleAndUnassignedHolders: Story = {
  name: "共同持有人与未指定持有人",
  args: {
    accounts: [
      {
        ...flowFixture.accounts[0],
        holders: [{ display_name: "我" }, { display_name: "妻子" }],
      },
      { ...flowFixture.accounts[1], holders: [{ display_name: "奶奶" }] },
      { ...flowFixture.accounts[2], holders: [] },
    ],
  },
};

export const WithoutCreatePermission: Story = {
  name: "无管理权限（隐藏新增入口）",
  args: { onAddAccount: undefined },
};
