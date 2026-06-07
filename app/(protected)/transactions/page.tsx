import { TransactionsHome } from "transactions-page/Transactions";
import { getTransactionErrorMessage } from "utils/pageErrors";

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; month?: string }>;
}) {
  const params = await searchParams;

  return (
    <TransactionsHome
      errorMessage={getTransactionErrorMessage(params.error)}
      month={params.month}
    />
  );
}
