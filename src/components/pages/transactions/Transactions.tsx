import {
  loadTransactionMonthPage,
  loadTransactionMonthView,
} from "server/loaders/transactions";
import { voidTransaction } from "server/actions/transactions";
import { TransactionsTemplate } from "transactions-template/Transactions";

type TransactionsHomeProps = {
  errorMessage: string | null;
  month: string | undefined;
};

export async function TransactionsHome({
  errorMessage,
  month,
}: TransactionsHomeProps) {
  const monthView = await loadTransactionMonthView(month);

  return (
    <TransactionsTemplate
      errorMessage={errorMessage}
      loadMoreAction={loadTransactionMonthPage.bind(null, monthView.month)}
      monthView={monthView}
      voidAction={voidTransaction}
    />
  );
}
