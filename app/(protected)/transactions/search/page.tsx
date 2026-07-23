import { unstable_rethrow } from "next/navigation";

import { loadTransactionSearchPage } from "internal/transaction/adapter/next/loadTransactionViews";
import {
  emptyTransactionSearchPage,
  normalizeTransactionSearchQuery,
} from "internal/transaction/util/transactionSearchHelpers";
import { TransactionSearchTemplate } from "templates/transactions/TransactionSearch";
import type { TransactionSearchPage as TransactionSearchPageData } from "types/transactions";
import { transactionSearchPageErrorMessages } from "utils/transactionMessages";

export default async function TransactionSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const params = await searchParams;
  const query = normalizeSearchParam(params.q);
  let initialPage: TransactionSearchPageData = emptyTransactionSearchPage;
  let errorMessage: string | null = null;

  if (query) {
    try {
      initialPage = await loadTransactionSearchPage(query);
    } catch (error) {
      unstable_rethrow(error);
      errorMessage = transactionSearchPageErrorMessages.initialLoadFailed;
    }
  }

  return (
    <TransactionSearchTemplate
      errorMessage={errorMessage}
      initialPage={initialPage}
      initialQuery={query}
      loadSearchPageAction={loadTransactionSearchPage}
    />
  );
}

function normalizeSearchParam(value: string | string[] | undefined) {
  const rawValue = Array.isArray(value) ? value[0] : value;
  return normalizeTransactionSearchQuery(rawValue ?? "");
}
