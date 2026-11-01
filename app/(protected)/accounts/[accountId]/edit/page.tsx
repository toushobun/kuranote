import {
  archiveAccount,
  updateAccount,
} from "internal/account/adapter/next/actions";
import { loadAccountEditView } from "internal/account/adapter/next/loadAccountsView";
import { AccountEditTemplate } from "templates/accounts/AccountEdit";

export default async function AccountEditPage({
  params,
}: {
  params: Promise<{ accountId: string }>;
}) {
  const { accountId } = await params;
  const view = await loadAccountEditView(accountId);

  return (
    <AccountEditTemplate
      {...view}
      archiveAccountAction={archiveAccount}
      updateAccountAction={updateAccount}
    />
  );
}
