"use client";

import { useActionState } from "react";

import { accountFormMessages } from "config/accountMessages";
import { routePaths } from "config/paths";
import { ArchiveAccountButton } from "molecules/accounts/ArchiveAccountButton";
import { ActionFailureFeedback } from "molecules/ui/OperationFeedbackDialogs";
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
  const [updateState, updateFormAction, updatePending] = useActionState(
    updateAccountAction,
    initialAccountActionState,
  );
  const [archiveState, archiveFormAction] = useActionState(
    archiveAccountAction,
    initialAccountActionState,
  );

  return (
    <SettingsPageLayout
      action={
        <form action={archiveFormAction} id={archiveAccountFormId}>
          <input name="accountId" readOnly type="hidden" value={account.id} />
          <ArchiveAccountButton
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
    </SettingsPageLayout>
  );
}
