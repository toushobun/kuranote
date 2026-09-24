import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { LedgerInviteTemplate } from "./LedgerInvite";

const meta = {
  title: "Templates/Ledgers/LedgerInvite",
  component: LedgerInviteTemplate,
  args: {
    preview: {
      inviteRole: "member",
      inviterName: "淞文",
      isPlaceholderBound: false,
      ledgerName: "家庭账本",
      placeholderDisplayName: null,
      status: "valid",
    },
    token: "storybook-invite-token",
  },
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof LedgerInviteTemplate>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Valid: Story = {};

export const Admin: Story = {
  args: {
    preview: {
      inviteRole: "admin",
      inviterName: "淞文",
      isPlaceholderBound: false,
      ledgerName: "家庭账本",
      placeholderDisplayName: null,
      status: "valid",
    },
  },
};

export const Viewer: Story = {
  args: {
    preview: {
      inviteRole: "viewer",
      inviterName: "淞文",
      isPlaceholderBound: false,
      ledgerName: "家庭账本",
      placeholderDisplayName: null,
      status: "valid",
    },
  },
};

export const AlreadyMember: Story = {
  args: {
    preview: {
      inviteRole: "member",
      inviterName: "淞文",
      isPlaceholderBound: false,
      ledgerName: "家庭账本",
      placeholderDisplayName: null,
      status: "already_member",
    },
  },
};

export const Invalid: Story = {
  args: {
    preview: {
      inviteRole: null,
      inviterName: null,
      isPlaceholderBound: false,
      ledgerName: null,
      placeholderDisplayName: null,
      status: "invalid",
    },
  },
};

export const Revoked: Story = {
  args: {
    preview: {
      inviteRole: null,
      inviterName: null,
      isPlaceholderBound: false,
      ledgerName: null,
      placeholderDisplayName: null,
      status: "revoked",
    },
  },
};

export const PlaceholderBound: Story = {
  name: "绑定待邀请成员（接管说明）",
  args: {
    preview: {
      inviteRole: "member",
      inviterName: "淞文",
      isPlaceholderBound: true,
      ledgerName: "家庭账本",
      placeholderDisplayName: "奶奶",
      status: "valid",
    },
  },
};

export const PlaceholderBoundMobile: Story = {
  ...PlaceholderBound,
  name: "绑定待邀请成员（移动端）",
  parameters: {
    layout: "fullscreen",
    viewport: { defaultViewport: "mobile2" },
  },
};
