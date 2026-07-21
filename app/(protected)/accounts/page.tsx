import { accountResultValues } from "config/paths";
import {
  archiveAccount,
  createAccount,
  updateAccount,
} from "server/account/adapter/next/actions";
import { loadAccountsView } from "server/account/adapter/next/loadAccountsView";
import {
  AccountsTemplate,
  type AccountSaveResult,
} from "templates/accounts/Accounts";
import { getAccountErrorMessage } from "utils/pageErrors";

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
  searchParams: Promise<{ error?: string; errorKey?: string; result?: string }>;
}) {
  const params = await searchParams;
  const view = await loadAccountsView();

  return (
    <AccountsTemplate
      errorKey={params.errorKey ?? null}
      errorMessage={getAccountErrorMessage(params.error)}
      saveResult={getAccountSaveResult(params.result)}
      {...view}
      archiveAccountAction={archiveAccount}
      createAccountAction={createAccount}
      updateAccountAction={updateAccount}
    />
  );
}
