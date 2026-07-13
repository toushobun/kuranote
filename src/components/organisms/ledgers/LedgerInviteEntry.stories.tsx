import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { LedgerInviteEntry } from "./LedgerInviteEntry";

const action = async () => {};

const meta = {
  title: "Organisms/Ledgers/LedgerInviteEntry",
  component: LedgerInviteEntry,
  args: {
    action,
    canInvite: true,
    errorMessage: null,
    ledgerId: "storybook-ledger",
    token: null,
  },
} satisfies Meta<typeof LedgerInviteEntry>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NoLink: Story = {
  name: "尚未生成邀请链接",
};

export const WithLink: Story = {
  name: "已生成邀请链接",
  args: {
    token: "storybook-invite-token",
  },
};

export const ReadOnly: Story = {
  name: "无邀请权限",
  args: {
    canInvite: false,
  },
};

export const WithError: Story = {
  name: "生成邀请链接失败",
  args: {
    errorMessage: "邀请链接生成失败，请稍后重试。",
  },
};
