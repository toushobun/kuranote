import type { Decorator } from "@storybook/nextjs-vite";

import { ConfirmDialogProvider } from "providers/ConfirmDialogProvider/ConfirmDialogProvider";
import { ledgerSetupDefaultRootCategoryNamesFixture } from "test/mocks/ledgerSetup";
import { UserThemeProvider } from "theme/UserThemeProvider";
import type {
  LedgerSetupInviteMembers,
  LedgerSetupProgress,
} from "types/ledgers";

import type { LedgerSetupWizardActions } from "./ledgerSetupWizardStepTypes";

/** 创建账本向导各 Story 共用的 Provider（用户主题与确认对话框）。 */
export const ledgerSetupWizardStoryDecorators: Decorator[] = [
  (Story) => (
    <UserThemeProvider>
      <ConfirmDialogProvider>
        <Story />
      </ConfirmDialogProvider>
    </UserThemeProvider>
  ),
];

/**
 * 各 Server Action 立即成功：保存与提交返回指定进度，完成创建返回成功，
 * 第 6 步读取返回指定的待邀请成员（默认为空）。
 */
export function createLedgerSetupWizardStoryActions(
  progress: LedgerSetupProgress | null,
  {
    inviteMembers = { pendingInvites: [], placeholderMembers: [] },
  }: {
    inviteMembers?: LedgerSetupInviteMembers;
  } = {},
): LedgerSetupWizardActions {
  const state = progress ? { progress } : {};
  const placeholderMemberAction = async () => ({
    successKey: crypto.randomUUID(),
  });

  return {
    completeSetup: async () => ({ completed: true }),
    createInvite: async () => ({}),
    loadInviteMembers: async () => ({ members: inviteMembers }),
    placeholderMemberActions: {
      delete: placeholderMemberAction,
      rename: placeholderMemberAction,
    },
    saveDraft: async () => state,
    submitBasicInfo: async () => state,
  };
}

/** 创建账本向导各 Story 共用的 args（Server Action 与进度由各 Story 指定）。 */
export const ledgerSetupWizardStoryArgs = {
  defaultRootCategoryNames: ledgerSetupDefaultRootCategoryNamesFixture,
  defaults: {
    baseCurrency: "JPY",
    displayColor: "amber" as const,
    displayName: "DENG SONGWEN",
    ledgerName: "家庭账本",
  },
  onClose: () => {},
  open: true,
};
