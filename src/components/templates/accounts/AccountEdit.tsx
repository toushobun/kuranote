"use client";

import { useActionState, useEffect, useState } from "react";

import { accountFormMessages } from "config/accountMessages";
import { routePaths } from "config/paths";
import { ArchiveAccountButton } from "molecules/accounts/ArchiveAccountButton";
import { ActionFailureFeedback } from "molecules/ui/OperationFeedbackDialogs";
import { UnsavedChangesDialog } from "molecules/ui/UnsavedChangesDialog";
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
  const [updateState, updateFormAction, updatePending] = useActionState(
    updateAccountAction,
    initialAccountActionState,
  );
  const [archiveState, archiveFormAction, archivePending] = useActionState(
    archiveAccountAction,
    initialAccountActionState,
  );
  const [isDirty, setIsDirty] = useState(false);
  // 有未保存修改时点返回 / 取消先确认，这里记下原本要去的地址。
  const [leaveHref, setLeaveHref] = useState<string | null>(null);

  useEffect(() => {
    if (!isDirty) return;

    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }

    // 页面内的返回 / 取消和 AppShell 底部导航都是链接：在 document 捕获阶段拦下，先弹确认。
    function interceptLeave(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0) return;
      const link =
        event.target instanceof Element
          ? event.target.closest<HTMLAnchorElement>("a[href]")
          : null;
      const href = link?.getAttribute("href");
      // 离开确认自己的「放弃修改」也是链接，弹框打开时放行。
      if (!href || link?.closest('[role="dialog"]')) return;

      event.preventDefault();
      event.stopPropagation();
      setLeaveHref(href);
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("click", interceptLeave, true);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("click", interceptLeave, true);
    };
  }, [isDirty]);

  function saveAndLeave() {
    setLeaveHref(null);
    const form = document.getElementById(editAccountFormId);
    if (form instanceof HTMLFormElement) form.requestSubmit();
  }

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
      <UnsavedChangesDialog
        discardHref={leaveHref ?? undefined}
        onCancel={() => setLeaveHref(null)}
        onSave={saveAndLeave}
        open={leaveHref !== null}
      />
    </SettingsPageLayout>
  );
}
