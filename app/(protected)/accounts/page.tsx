import { AccountsHome } from "accounts-page/Accounts";
import { getAccountErrorMessage } from "utils/pageErrors";

type AccountsPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function AccountsPage({
  searchParams,
}: AccountsPageProps) {
  const params = await searchParams;

  return <AccountsHome errorMessage={getAccountErrorMessage(params.error)} />;
}
