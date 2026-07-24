import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { UserThemeProvider } from "theme/UserThemeProvider";

import { LedgerSettingsTemplate } from "./LedgerSettings";

const meta = {
  title: "Templates/Ledgers/LedgerSettingsTemplate",
  component: LedgerSettingsTemplate,
  decorators: [
    (Story) => (
      <UserThemeProvider storageScope="ledger-settings-story">
        <Story />
      </UserThemeProvider>
    ),
  ],
  args: {
    canEditLedger: true,
    currentUser: {
      displayColor: "amber",
      displayName: "DENG SONGWEN",
      userId: "00000000-0000-4000-8000-000000000031",
    },
    errorMessage: null,
    inviteAction: async () => ({}),
    ledger: {
      baseCurrency: "JPY",
      currentUserRole: "owner",
      id: "00000000-0000-4000-8000-000000000032",
      isCurrent: true,
      name: "家庭账本",
    },
    members: [
      {
        avatarUrl: null,
        displayColor: "amber",
        displayName: "DENG SONGWEN",
        email: "songwen@example.com",
        role: "owner",
        userId: "00000000-0000-4000-8000-000000000031",
      },
      {
        avatarUrl: null,
        displayColor: "sakura",
        displayName: "配偶",
        email: null,
        role: "member",
        userId: "00000000-0000-4000-8000-000000000034",
      },
    ],
    pendingInvites: [],
    saveResult: null,
    updateLedgerSettingsAction: async () => {},
  },
} satisfies Meta<typeof LedgerSettingsTemplate>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "账本设置页",
};

export const MemberReadonly: Story = {
  name: "普通成员查看",
  args: {
    canEditLedger: false,
    ledger: {
      baseCurrency: "JPY",
      currentUserRole: "member",
      id: "00000000-0000-4000-8000-000000000032",
      isCurrent: true,
      name: "家庭账本",
    },
  },
};
