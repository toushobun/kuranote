import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ConfirmDialogProvider } from "providers/ConfirmDialogProvider/ConfirmDialogProvider";
import { UserThemeProvider } from "theme/UserThemeProvider";

import { LedgerPlaceholderMemberDialog } from "./LedgerPlaceholderMemberDialog";

const placeholder = { displayName: "奶奶", id: "placeholder-1" };

const meta = {
  title: "Organisms/Ledgers/LedgerPlaceholderMemberDialog",
  component: LedgerPlaceholderMemberDialog,
  decorators: [
    (Story) => (
      <UserThemeProvider storageScope="storybook-placeholder-member-dialog">
        <ConfirmDialogProvider>
          <Story />
        </ConfirmDialogProvider>
      </UserThemeProvider>
    ),
  ],
  args: {
    actions: {
      delete: async () => ({}),
      rename: async () => ({}),
    },
    ledgerId: "ledger-1",
    onClose: () => {},
    onCreateInvite: () => {},
    onOpenInvite: () => {},
    open: true,
    row: { invite: null, placeholder },
  },
} satisfies Meta<typeof LedgerPlaceholderMemberDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const EditWithoutInvite: Story = {
  name: "改名 / 删除（未生成链接，含撤销后）",
};

export const EditWithBoundInvite: Story = {
  name: "改名 / 删除（已生成链接）",
  args: {
    row: {
      invite: {
        createdAt: "2026-09-01T09:30:00.000Z",
        id: "invite-1",
        placeholderId: placeholder.id,
        role: "member",
        token: "a".repeat(64),
      },
      placeholder,
    },
  },
};

export const ReadOnly: Story = {
  name: "只读（非管理者）",
  args: { actions: null },
};

export const Mobile: Story = {
  name: "移动端",
  parameters: { viewport: { defaultViewport: "mobile2" } },
};
