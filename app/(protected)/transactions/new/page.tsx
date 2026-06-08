import { NewTransactionPage } from "pages/transactions/NewTransaction";
import { getNewTransactionErrorMessage } from "utils/pageErrors";

export default async function TransactionsNewPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <NewTransactionPage
      errorMessage={getNewTransactionErrorMessage(params.error)}
    />
  );
}
