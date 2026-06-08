import { AccountsTemplate } from "templates/accounts/Accounts";
import {
  archiveAccount,
  createAccount,
  updateAccount,
} from "server/actions/accounts";
import { loadAccountsView } from "server/loaders/accounts";

type AccountsHomeProps = {
  errorMessage: string | null;
};

export async function AccountsHome({ errorMessage }: AccountsHomeProps) {
  const view = await loadAccountsView();

  return (
    <AccountsTemplate
      errorMessage={errorMessage}
      {...view}
      archiveAccountAction={archiveAccount}
      createAccountAction={createAccount}
      updateAccountAction={updateAccount}
    />
  );
}
