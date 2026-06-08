import { createTransaction } from "server/actions/transactions";
import { loadNewTransactionView } from "server/loaders/newTransaction";
import { NewTransactionTemplate } from "templates/transactions/NewTransaction";

type NewTransactionPageProps = {
  errorMessage: string | null;
};

export async function NewTransactionPage({
  errorMessage,
}: NewTransactionPageProps) {
  const view = await loadNewTransactionView();

  return (
    <NewTransactionTemplate
      action={createTransaction}
      errorMessage={errorMessage}
      {...view}
    />
  );
}
