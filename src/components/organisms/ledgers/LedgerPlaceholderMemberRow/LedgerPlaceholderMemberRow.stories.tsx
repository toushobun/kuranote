import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { LedgerPlaceholderMemberRow } from "./LedgerPlaceholderMemberRow";

const placeholder = { displayName: "奶奶", id: "placeholder-1" };

const meta = {
  title: "Organisms/Ledgers/LedgerPlaceholderMemberRow",
  component: LedgerPlaceholderMemberRow,
  args: {
    canManage: true,
    onClick: () => {},
    row: { invite: null, placeholder },
  },
} satisfies Meta<typeof LedgerPlaceholderMemberRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithoutInvite: Story = {
  name: "未生成链接（含撤销后）",
};

export const WithBoundInvite: Story = {
  name: "已生成链接（等待加入）",
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
  args: { canManage: false },
};

export const Mobile: Story = {
  name: "移动端",
  args: {
    row: {
      invite: null,
      placeholder: { displayName: "住在老家的外婆（妈妈那边）", id: "p-2" },
    },
  },
  parameters: { viewport: { defaultViewport: "mobile2" } },
};
