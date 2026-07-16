import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { LedgerInviteTemplate } from "./LedgerInvite";

const acceptAction = async () => {};

const meta = {
  title: "Templates/Ledgers/LedgerInvite",
  component: LedgerInviteTemplate,
  args: {
    acceptAction,
    errorMessage: null,
    preview: {
      inviteRole: "member",
      inviterName: "淞文",
      ledgerName: "家庭账本",
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
      ledgerName: "家庭账本",
      status: "valid",
    },
  },
};

export const Viewer: Story = {
  args: {
    preview: {
      inviteRole: "viewer",
      inviterName: "淞文",
      ledgerName: "家庭账本",
      status: "valid",
    },
  },
};

export const AlreadyMember: Story = {
  args: {
    preview: {
      inviteRole: "member",
      inviterName: "淞文",
      ledgerName: "家庭账本",
      status: "already_member",
    },
  },
};

export const Invalid: Story = {
  args: {
    preview: {
      inviteRole: null,
      inviterName: null,
      ledgerName: null,
      status: "invalid",
    },
  },
};

export const Revoked: Story = {
  args: {
    preview: {
      inviteRole: null,
      inviterName: null,
      ledgerName: null,
      status: "revoked",
    },
  },
};
