import { NewTransactionPage } from "transactions-page/NewTransaction";
import { getNewTransactionErrorMessage } from "utils/pageErrors";

type NewTransactionPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function NewTransactionRoute({
  searchParams,
}: NewTransactionPageProps) {
  const params = await searchParams;

  return (
    <NewTransactionPage
      errorMessage={getNewTransactionErrorMessage(params.error)}
    />
  );
}
