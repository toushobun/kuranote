import { AccountsHome } from "accounts-page/Accounts";
import { getAccountErrorMessage } from "utils/pageErrors";

export default async function AccountsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return <AccountsHome errorMessage={getAccountErrorMessage(params.error)} />;
}
