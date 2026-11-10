import { userEvent, within } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import {
  accountHolderOptionsFixture,
  accountPlaceholderHolderOptionsFixture,
  createMemberAccountHolder,
  inactiveAccountHolderOptionFixture,
} from "test/mocks/accountHolders";
import {
  accountWebsiteIconFixture,
  bankAccountFixture,
} from "test/mocks/accounts";

import type { WebsiteIconActionState } from "types/actions";

import { AccountForm } from "./AccountForm";

const fetchIconAction = async (): Promise<WebsiteIconActionState> => ({
  iconUrl: accountWebsiteIconFixture.icon_url,
});

const meta = {
  component: AccountForm,
  title: "Organisms/Accounts/AccountForm",
  args: {
    action: async () => {},
    fetchIconAction,
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

export const Edit: Story = {
  name: "编辑：以当前值填入",
  args: { account: bankAccountFixture },
};

export const EditCurrencyLocked: Story = {
  name: "编辑：已有交易不能改币种",
  args: { account: { ...bankAccountFixture, has_transactions: true } },
};

export const EditInactiveHolder: Story = {
  name: "编辑：非活跃成员持有人",
  args: {
    account: {
      ...bankAccountFixture,
      holders: [createMemberAccountHolder(inactiveAccountHolderOptionFixture)],
    },
  },
};

const accountWithWebsite = {
  ...bankAccountFixture,
  website_url: accountWebsiteIconFixture.website_url,
};
const fetchIcon: NonNullable<Story["play"]> = async ({ canvasElement }) => {
  await userEvent.click(
    within(canvasElement).getByRole("button", { name: "获取图标" }),
  );
};

export const IconLoading: Story = {
  name: "网站图标：获取中",
  args: {
    account: accountWithWebsite,
    fetchIconAction: () => new Promise(() => {}),
  },
  play: fetchIcon,
};

export const IconSuccess: Story = {
  name: "网站图标：已获取",
  args: { account: { ...accountWithWebsite, ...accountWebsiteIconFixture } },
};

export const IconError: Story = {
  name: "网站图标：获取失败",
  args: {
    account: accountWithWebsite,
    fetchIconAction: async () => ({}),
  },
  play: fetchIcon,
};
