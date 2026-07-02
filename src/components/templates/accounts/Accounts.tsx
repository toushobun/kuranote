import Stack from "@mui/material/Stack";

import { ResultFeedback } from "molecules/ui/ResultFeedback";
import { SectionCard } from "molecules/ui/SectionCard";
import { AccountForm } from "organisms/accounts/AccountForm";
import { AccountList } from "organisms/accounts/AccountList";
import { PageHeader } from "templates/layout/PageHeader";
import { PageShell } from "templates/layout/PageShell";
import type { ServerAction } from "types/actions";
import type { AccountHolderOption, AccountRow } from "types/accounts";

type AccountsTemplateProps = {
  accounts: AccountRow[];
  archiveAccountAction: ServerAction;
  baseCurrency: string;
  createAccountAction: ServerAction;
  errorMessage: string | null;
  holderOptions: AccountHolderOption[];
  ledgerName: string;
  updateAccountAction: ServerAction;
};

export function AccountsTemplate({
  accounts,
  archiveAccountAction,
  baseCurrency,
  createAccountAction,
  errorMessage,
  holderOptions,
  ledgerName,
  updateAccountAction,
}: AccountsTemplateProps) {
  return (
    <PageShell>
      <PageHeader
        title="账户"
        subtitle={
          <Stack spacing={0.5}>
            <span>当前账本：{ledgerName}</span>
            <span>管理现金、银行账户、信用卡、电子钱包等账户。</span>
          </Stack>
        }
      />

      {errorMessage ? (
        <ResultFeedback
          message={errorMessage}
          surface="card"
          title="账户操作失败"
          variant="error"
        />
      ) : null}

      <SectionCard>
        <AccountForm
          createAccountAction={createAccountAction}
          defaultCurrency={baseCurrency}
          holderOptions={holderOptions}
        />
      </SectionCard>

      <AccountList
        accounts={accounts}
        archiveAccountAction={archiveAccountAction}
        holderOptions={holderOptions}
        updateAccountAction={updateAccountAction}
      />
    </PageShell>
  );
}
