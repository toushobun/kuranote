"use client";

import { useActionState, useState } from "react";

import { useUnsavedChangesGuard } from "molecules/ui/UnsavedChangesDialog/useUnsavedChangesGuard";

import { accountFormMessages } from "config/accountMessages";
import { routePaths } from "config/paths";
import { ArchiveAccountButton } from "molecules/accounts/ArchiveAccountButton";
import { ActionFailureFeedback } from "molecules/ui/OperationFeedbackDialogs";
import { UnsavedChangesDialog } from "molecules/ui/UnsavedChangesDialog/UnsavedChangesDialog";
import { AccountForm } from "organisms/accounts/AccountForm/AccountForm";
import { bottomNavigationLayout } from "organisms/navigation/bottomNavigationLayout";
import { TransactionAmountKeypadLauncher } from "organisms/transactions/TransactionAmountKeypadLauncher/TransactionAmountKeypadLauncher";
import {
  SettingsPageLayout,
  settingsPageActionButtonSx,
} from "templates/layout/SettingsPageLayout";
import type {
  Account,
  AccountActionState,
  AccountHolderOption,
  AccountPlaceholderHolderOption,
  AccountStateAction,
} from "types/accounts";

const archiveAccountFormId = "archive-account-form";
const editAccountFormId = "edit-account-form";

type AccountEditTemplateProps = {
  account: Account;
  archiveAccountAction: AccountStateAction;
  baseCurrency: string;
  canWriteTransactions?: boolean;
  holderOptions: AccountHolderOption[];
  ledgerName: string;
  placeholderHolderOptions?: AccountPlaceholderHolderOption[];
  updateAccountAction: AccountStateAction;
};

const initialAccountActionState: AccountActionState = {};

/** 编辑账户页面：与新增页同一张表单，右上角删除（归档）账户。 */
export function AccountEditTemplate({
  account,
  archiveAccountAction,
  baseCurrency,
  canWriteTransactions = true,
  holderOptions,
  ledgerName,
  placeholderHolderOptions = [],
  updateAccountAction,
}: AccountEditTemplateProps) {
  const [isDirty, setIsDirty] = useState(false);
  const guard = useUnsavedChangesGuard({
    isDirty,
    saveFormId: editAccountFormId,
  });
  const [updateState, updateFormAction, updatePending] = useActionState(
    (state: AccountActionState, data: FormData) =>
      guard.runAction(() => updateAccountAction(state, data)),
    initialAccountActionState,
  );
  const [archiveState, archiveFormAction, archivePending] = useActionState(
    (state: AccountActionState, data: FormData) =>
      guard.runAction(() => archiveAccountAction(state, data)),
    initialAccountActionState,
  );

  return (
    <SettingsPageLayout
      action={
        <form action={archiveFormAction} id={archiveAccountFormId}>
          <input name="accountId" readOnly type="hidden" value={account.id} />
          <ArchiveAccountButton
            disabled={archivePending}
            formId={archiveAccountFormId}
            label={accountFormMessages.archive}
            size="small"
            sx={settingsPageActionButtonSx}
          />
        </form>
      }
      back={{
        href: routePaths.accounts,
        label: accountFormMessages.backToAccounts,
      }}
      subtitle={accountFormMessages.editSubtitle(ledgerName)}
      title={accountFormMessages.editTitle}
    >
      <AccountForm
        account={account}
        action={updateFormAction}
        defaultCurrency={baseCurrency}
        holderOptions={holderOptions}
        id={editAccountFormId}
        onDirtyChange={setIsDirty}
        pending={updatePending}
        placeholderHolderOptions={placeholderHolderOptions}
      />
      {/* 当前余额输入框沿用记账的金额键盘。 */}
      {canWriteTransactions ? <TransactionAmountKeypadLauncher /> : null}
      <ActionFailureFeedback
        aboveModal
        bottomOffset={bottomNavigationLayout.feedbackBottomOffset}
        state={updateState}
        title={accountFormMessages.editErrorTitle}
      />
      <ActionFailureFeedback
        aboveModal
        bottomOffset={bottomNavigationLayout.feedbackBottomOffset}
        state={archiveState}
        title={accountFormMessages.archiveErrorTitle}
      />
      <UnsavedChangesDialog {...guard.dialogProps} />
    </SettingsPageLayout>
  );
}
