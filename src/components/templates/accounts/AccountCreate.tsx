"use client";

import { useActionState } from "react";

import { accountFormMessages } from "config/accountMessages";
import { routePaths } from "config/paths";
import { ActionFailureFeedback } from "molecules/ui/OperationFeedbackDialogs";
import { AccountForm } from "organisms/accounts/AccountForm/AccountForm";
import { bottomNavigationLayout } from "organisms/navigation/bottomNavigationLayout";
import { TransactionAmountKeypadLauncher } from "organisms/transactions/TransactionAmountKeypadLauncher/TransactionAmountKeypadLauncher";
import { SettingsPageLayout } from "templates/layout/SettingsPageLayout";
import type {
  AccountActionState,
  AccountHolderOption,
  AccountPlaceholderHolderOption,
  AccountStateAction,
} from "types/accounts";

type AccountCreateTemplateProps = {
  baseCurrency: string;
  canWriteTransactions?: boolean;
  createAccountAction: AccountStateAction;
  holderOptions: AccountHolderOption[];
  ledgerName: string;
  placeholderHolderOptions?: AccountPlaceholderHolderOption[];
  /** 从记一笔等页面进入时的来源路径：保存后带着新账户回去，取消也回到这里。 */
  returnTo?: string | null;
};

const initialAccountActionState: AccountActionState = {};

export function AccountCreateTemplate({
  baseCurrency,
  canWriteTransactions = true,
  createAccountAction,
  holderOptions,
  ledgerName,
  placeholderHolderOptions = [],
  returnTo = null,
}: AccountCreateTemplateProps) {
  const [state, formAction, pending] = useActionState(
    createAccountAction,
    initialAccountActionState,
  );

  return (
    <SettingsPageLayout
      back={
        returnTo
          ? { href: returnTo, label: accountFormMessages.back }
          : {
              href: routePaths.accounts,
              label: accountFormMessages.backToAccounts,
            }
      }
      subtitle={accountFormMessages.createSubtitle(ledgerName)}
      title={accountFormMessages.createTitle}
    >
      <AccountForm
        action={formAction}
        defaultCurrency={baseCurrency}
        holderOptions={holderOptions}
        pending={pending}
        placeholderHolderOptions={placeholderHolderOptions}
        returnTo={returnTo}
      />
      {/* 初始金额输入框沿用记账的金额键盘。 */}
      {canWriteTransactions ? <TransactionAmountKeypadLauncher /> : null}
      <ActionFailureFeedback
        aboveModal
        bottomOffset={bottomNavigationLayout.feedbackBottomOffset}
        state={state}
        title={accountFormMessages.createErrorTitle}
      />
    </SettingsPageLayout>
  );
}
