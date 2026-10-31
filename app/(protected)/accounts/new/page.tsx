import { createAccount } from "internal/account/adapter/next/actions";
import { loadAccountCreateView } from "internal/account/adapter/next/loadAccountsView";
import { getSafeNextPath } from "lib/navigation/safeNextPath";
import { AccountCreateTemplate } from "templates/accounts/AccountCreate";

export default async function AccountCreatePage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const params = await searchParams;
  const view = await loadAccountCreateView();

  return (
    <AccountCreateTemplate
      {...view}
      createAccountAction={createAccount}
      returnTo={getSafeNextPath(params.returnTo)}
    />
  );
}
