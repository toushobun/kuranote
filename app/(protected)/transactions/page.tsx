import { TransactionsHome } from "transactions-page/Transactions";
import { getTransactionErrorMessage } from "utils/pageErrors";

type TransactionsPageProps = {
  searchParams: Promise<{
    error?: string;
    month?: string;
  }>;
};

export default async function TransactionsPage({
  searchParams,
}: TransactionsPageProps) {
  const params = await searchParams;

  return (
    <TransactionsHome
      errorMessage={getTransactionErrorMessage(params.error)}
      month={params.month}
    />
  );
}
