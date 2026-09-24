import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { ComponentProps } from "react";
import { userEvent, within } from "storybook/test";

import { ConfirmDialogProvider } from "providers/ConfirmDialogProvider/ConfirmDialogProvider";
import { UserThemeProvider } from "theme/UserThemeProvider";
import type { LedgerInviteStateAction } from "types/ledgers";

import { LedgerInviteEntry } from "./LedgerInviteEntry";
import { LedgerInvitePendingProvider } from "../LedgerInvitePendingContext/LedgerInvitePendingContext";

const action: LedgerInviteStateAction = async () => ({});
const pendingInvites = [
  {
    createdAt: "2026-07-13T09:00:00.000Z",
    id: "storybook-invite-id",
    placeholderId: null,
    role: "member" as const,
    token: "storybook-pending-invite-token",
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
    ledgerId: "storybook-ledger",
    token: null,
  },
} satisfies Meta<typeof LedgerInviteEntry>;

export default meta;
type Story = StoryObj<typeof meta>;
type LedgerInviteEntryArgs = ComponentProps<typeof LedgerInviteEntry>;

function renderWithPendingInvites(args: LedgerInviteEntryArgs) {
  const visibleInvites = args.canInvite
    ? pendingInvites
    : pendingInvites.map((invite) => ({ ...invite, token: null }));

  return (
    <LedgerInvitePendingProvider pendingInvites={visibleInvites}>
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
    action: async () => ({
      error: "邀请链接生成失败，请稍后重试。",
      errorKey: "storybook-create-failed",
      operation: "create",
    }),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      await canvas.findByRole("button", { name: "邀请成员" }),
    );
    await userEvent.click(
      await within(document.body).findByRole("button", {
        name: "生成邀请链接",
      }),
    );
    await within(document.body).findByRole("heading", {
      name: "生成邀请链接失败",
    });
  },
};

const placeholderMembers = [
  { displayName: "奶奶", id: "storybook-placeholder-1" },
  { displayName: "爷爷", id: "storybook-placeholder-2" },
];
const boundInvite = {
  createdAt: "2026-09-01T09:30:00.000Z",
  id: "storybook-bound-invite-id",
  placeholderId: placeholderMembers[0].id,
  role: "member" as const,
  token: "storybook-bound-invite-token",
};
const placeholderMemberActions = {
  create: async () => ({}),
  delete: async () => ({}),
  rename: async () => ({}),
};

function renderWithPlaceholders(args: LedgerInviteEntryArgs) {
  return (
    <UserThemeProvider storageScope="storybook-ledger-invite-entry">
      <ConfirmDialogProvider>
        <LedgerInvitePendingProvider
          pendingInvites={
            args.canInvite ? [boundInvite, ...pendingInvites] : []
          }
        >
          <LedgerInviteEntry {...args} />
        </LedgerInvitePendingProvider>
      </ConfirmDialogProvider>
    </UserThemeProvider>
  );
}

export const WithPlaceholderMembers: Story = {
  name: "待邀请成员（含绑定邀请）与匿名邀请",
  args: { placeholderMemberActions, placeholderMembers },
  render: renderWithPlaceholders,
};

export const BoundInviteCopyArea: Story = {
  name: "绑定邀请的复制区域（接管说明）",
  args: { placeholderMemberActions, placeholderMembers },
  render: renderWithPlaceholders,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      await canvas.findByRole("button", { name: "奶奶，待接受邀请" }),
    );
    await userEvent.click(
      await within(document.body).findByRole("button", {
        name: /查看邀请链接/,
      }),
    );
  },
};

export const BoundInviteCopyAreaMobile: Story = {
  ...BoundInviteCopyArea,
  name: "绑定邀请的复制区域（移动端）",
  parameters: { viewport: { defaultViewport: "mobile2" } },
};

export const PlaceholderReadOnly: Story = {
  name: "待邀请成员（非管理者只读）",
  args: {
    canInvite: false,
    placeholderMemberActions: null,
    placeholderMembers,
  },
  render: renderWithPlaceholders,
};
