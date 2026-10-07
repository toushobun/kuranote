import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { LedgerSetupWizard } from "organisms/ledgers/LedgerSetupWizard/LedgerSetupWizard";
import {
  createLedgerSetupWizardStoryActions,
  ledgerSetupWizardStoryArgs,
  ledgerSetupWizardStoryDecorators,
} from "organisms/ledgers/LedgerSetupWizard/ledgerSetupWizardStoryUtils";
import { createLedgerSetupConfirmProgressFixture } from "test/mocks/ledgerSetup";
import type { LedgerSetupInviteMembers } from "types/ledgers";

// 以第 6 步打开向导（正式流程中只会在完成写入后进入）。
const inviteProgress = (() => {
  const progress = createLedgerSetupConfirmProgressFixture();
  return { ...progress, setup: { ...progress.setup, step: 6 } };
})();

const inviteMembers: LedgerSetupInviteMembers = {
  pendingInvites: [
    {
      createdAt: "2026-10-07T01:00:00.000Z",
      id: "invite-1",
      placeholderId: "placeholder-1",
      role: "member",
      token: "a".repeat(64),
    },
  ],
  placeholderMembers: [
    { displayName: "奶奶", id: "placeholder-1" },
    { displayName: "爷爷", id: "placeholder-2" },
  ],
};

// 第 6 步依赖向导骨架提供的步骤回调与进度，因此在向导中展示。
const meta = {
  title: "Organisms/Ledgers/LedgerSetupInviteStep",
  component: LedgerSetupWizard,
  decorators: ledgerSetupWizardStoryDecorators,
  args: {
    actions: createLedgerSetupWizardStoryActions(inviteProgress),
    ...ledgerSetupWizardStoryArgs,
    progress: inviteProgress,
  },
  parameters: { viewport: { defaultViewport: "mobile2" } },
} satisfies Meta<typeof LedgerSetupWizard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  name: "无待邀请成员",
};

export const WithPlaceholderMembers: Story = {
  name: "有待邀请成员",
  args: {
    actions: createLedgerSetupWizardStoryActions(inviteProgress, {
      inviteMembers,
    }),
  },
};

export const LoadFailed: Story = {
  name: "读取失败",
  args: {
    actions: {
      ...createLedgerSetupWizardStoryActions(inviteProgress),
      loadInviteMembers: async () => ({
        error: "邀请成员加载失败，请稍后重试。",
      }),
    },
  },
};
