"use client";

import Box from "@mui/material/Box";
import { useActionState, useEffect, useState, type MouseEvent } from "react";

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

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  function interceptLeave(event: MouseEvent<HTMLElement>) {
    if (!isDirty || leaveHref !== null) return;
    const link =
      event.target instanceof Element
        ? event.target.closest<HTMLAnchorElement>("a[href]")
        : null;
    const href = link?.getAttribute("href");
    if (!href) return;

    event.preventDefault();
    event.stopPropagation();
    setLeaveHref(href);
  }

  function saveAndLeave() {
    setLeaveHref(null);
    const form = document.getElementById(editAccountFormId);
    if (form instanceof HTMLFormElement) form.requestSubmit();
  }

  return (
    // 返回按钮与「取消」都是链接：捕获阶段拦下，未保存时先弹确认。
    <Box onClickCapture={interceptLeave} sx={{ display: "contents" }}>
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
    </Box>
  );
}
