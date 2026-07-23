import { accountResultValues } from "config/paths";
import {
  archiveAccount,
  createAccount,
  updateAccount,
} from "internal/account/adapter/next/actions";
import { loadAccountsView } from "internal/account/adapter/next/loadAccountsView";
import {
  AccountsTemplate,
  type AccountSaveResult,
} from "templates/accounts/Accounts";

function getAccountSaveResult(
  result: string | undefined,
): AccountSaveResult | null {
  if (result === accountResultValues.archived) return "archived";
  if (result === accountResultValues.created) return "created";
  if (result === accountResultValues.updated) return "updated";
  return null;
}

export default async function AccountsPage({
  searchParams,
}: {
  searchParams: Promise<{ result?: string }>;
}) {
  const params = await searchParams;
  const view = await loadAccountsView();

  return (
    <AccountsTemplate
      saveResult={getAccountSaveResult(params.result)}
      {...view}
      archiveAccountAction={archiveAccount}
      createAccountAction={createAccount}
      updateAccountAction={updateAccount}
    />
  );
}
