"use client";
import { useCreateAction } from "molecules/ui/useCreateAction/useCreateAction";

import { accountFormMessages } from "config/accountMessages";
import { routePaths } from "config/paths";
import { ActionFailureFeedback } from "molecules/ui/OperationFeedbackDialogs";
import { AccountForm } from "organisms/accounts/AccountForm/AccountForm";
import { bottomNavigationLayout } from "organisms/navigation/bottomNavigationLayout";
import { TransactionAmountKeypadLauncher } from "organisms/transactions/TransactionAmountKeypadLauncher/TransactionAmountKeypadLauncher";
import { SettingsPageLayout } from "templates/layout/SettingsPageLayout";
import type {
  AccountHolderOption,
  AccountPlaceholderHolderOption,
  AccountStateAction,
} from "types/accounts";

export type AccountCreateTemplateProps = {
  onCancel?: () => void;
  onCreated?: (
    entity: NonNullable<
      import("types/accounts").AccountActionState["createdAccount"]
    >,
  ) => void;
  baseCurrency: string;
  canWriteTransactions?: boolean;
  createAccountAction: AccountStateAction;
  holderOptions: AccountHolderOption[];
  ledgerName: string;
  placeholderHolderOptions?: AccountPlaceholderHolderOption[];
  /** 从记一笔等页面进入时的来源路径：保存后带着新账户回去，取消也回到这里。 */
  returnTo?: string | null;
};

export function AccountCreateTemplate(props: AccountCreateTemplateProps) {
  return (
    <SettingsPageLayout
      back={{
        href: props.returnTo ?? routePaths.accounts,
        label: props.returnTo
          ? accountFormMessages.back
          : accountFormMessages.backToAccounts,
      }}
      subtitle={accountFormMessages.createSubtitle(props.ledgerName)}
      title={accountFormMessages.createTitle}
    >
      <AccountCreateBody {...props} />
    </SettingsPageLayout>
  );
}

export function AccountCreateBody({
  baseCurrency,
  canWriteTransactions = true,
  createAccountAction,
  holderOptions,
  placeholderHolderOptions = [],
  returnTo = null,
  onCancel,
  onCreated,
}: AccountCreateTemplateProps) {
  const [state, formAction, pending] = useCreateAction(
    createAccountAction,
    {},
    (value) => value.createdAccount,
    onCreated,
  );

  return (
    <>
      <AccountForm
        action={formAction}
        defaultCurrency={baseCurrency}
        holderOptions={holderOptions}
        pending={pending}
        placeholderHolderOptions={placeholderHolderOptions}
        onCancel={onCancel}
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
    </>
  );
}
