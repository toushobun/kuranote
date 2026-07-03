"use server";

import {
  buildTransactionListItemsFromContext,
  loadTransactionGroupLoaderContext,
} from "server/loaders/transactionStep4Groups/context";
import {
  buildTransactionSearchPage,
  emptyTransactionSearchPage,
  normalizeTransactionSearchQuery,
} from "server/loaders/transactionSearchHelpers";
import type { TransactionSearchPage } from "types/transactions";

export async function loadTransactionSearchPage(
  rawQuery: string,
  offset = 0,
): Promise<TransactionSearchPage> {
  const query = normalizeTransactionSearchQuery(rawQuery);

  if (!query) return emptyTransactionSearchPage;

  const context = await loadTransactionGroupLoaderContext();
  const items = buildTransactionListItemsFromContext(context.records, context);

  return buildTransactionSearchPage(items, query, offset);
}
