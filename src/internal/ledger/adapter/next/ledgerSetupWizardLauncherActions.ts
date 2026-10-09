import { createLedgerSetupInvite } from "internal/ledger/adapter/next/actions/ledgerInvite";
import {
  deleteLedgerPlaceholderMember,
  renameLedgerPlaceholderMember,
} from "internal/ledger/adapter/next/actions/ledgerPlaceholderMember";
import {
  abandonLedgerSetup,
  completeLedgerSetup,
  loadLedgerSetupInviteMembers,
  loadLedgerSetupWizardView,
  saveLedgerSetupDraft,
  submitLedgerSetupBasicInfo,
} from "internal/ledger/adapter/next/actions/ledgerSetup";
import type { LedgerSetupWizardLauncherActions } from "types/ledgers";

/**
 * 打开创建账本向导所需的全部 Server Action，只在这里组装一次。
 * 首页与账本管理页的 page 原样传给 LedgerSetupWizardLauncher，不各自组装。
 */
export const ledgerSetupWizardLauncherActions: LedgerSetupWizardLauncherActions =
  {
    loadWizard: loadLedgerSetupWizardView,
    wizard: {
      abandonSetup: abandonLedgerSetup,
      completeSetup: completeLedgerSetup,
      // 不使用账本设置页的 createLedgerInvite：它成功后会跳转到账本设置页。
      createInvite: createLedgerSetupInvite,
      loadInviteMembers: loadLedgerSetupInviteMembers,
      placeholderMemberActions: {
        delete: deleteLedgerPlaceholderMember,
        rename: renameLedgerPlaceholderMember,
      },
      saveDraft: saveLedgerSetupDraft,
      submitBasicInfo: submitLedgerSetupBasicInfo,
    },
  };
