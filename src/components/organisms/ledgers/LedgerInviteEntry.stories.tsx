import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { ComponentProps } from "react";
import { userEvent, within } from "storybook/test";

import { LedgerInviteEntry } from "./LedgerInviteEntry";
import { LedgerInvitePendingProvider } from "./LedgerInvitePendingContext";

const action = async () => {};
const pendingInvites = [
  {
    createdAt: "2026-07-13T09:00:00.000Z",
    id: "storybook-invite-id",
    role: "member" as const,
  },
];

const meta = {
  title: "Organisms/Ledgers/LedgerInviteEntry",
  component: LedgerInviteEntry,
  decorators: [
    (Story) => (
      <LedgerInvitePendingProvider pendingInvites={[]}>
        <Story />
      </LedgerInvitePendingProvider>
    ),
  ],
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
type LedgerInviteEntryArgs = ComponentProps<typeof LedgerInviteEntry>;

function renderWithPendingInvites(args: LedgerInviteEntryArgs) {
  return (
    <LedgerInvitePendingProvider pendingInvites={pendingInvites}>
      <LedgerInviteEntry {...args} />
    </LedgerInvitePendingProvider>
  );
}

export const NoLink: Story = {
  name: "无待邀请且尚未生成链接",
};

export const WithLink: Story = {
  name: "已生成邀请链接",
  args: {
    token: "storybook-invite-token",
  },
};

export const PendingInvite: Story = {
  name: "存在待接受邀请",
  render: renderWithPendingInvites,
};

export const RevokeConfirmation: Story = {
  name: "撤销邀请确认",
  render: renderWithPendingInvites,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      await canvas.findByRole("button", { name: /待接受邀请/ }),
    );
    await userEvent.click(
      await within(document.body).findByRole("button", { name: "撤销邀请" }),
    );
    await within(document.body).findByRole("heading", {
      name: "确认撤销邀请？",
    });
  },
};

export const PendingInviteReadonly: Story = {
  name: "普通成员查看待接受邀请",
  args: {
    canInvite: false,
  },
  render: renderWithPendingInvites,
};

export const ReadOnly: Story = {
  name: "无邀请权限且无待邀请",
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
