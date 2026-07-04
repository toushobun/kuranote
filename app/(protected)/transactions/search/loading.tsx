import { TransactionSearchTemplate } from "templates/transactions/TransactionSearch";

const emptyTransactionSearchPage = {
  items: [],
  nextOffset: null,
  totalCount: 0,
};

export default function TransactionsSearchLoadingPage() {
  return (
    <TransactionSearchTemplate
      errorMessage={null}
      initialPage={emptyTransactionSearchPage}
      initialQuery=""
      isLoading
    />
  );
}
