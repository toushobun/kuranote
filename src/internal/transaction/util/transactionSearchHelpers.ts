import type { TransactionSearchPage } from "internal/transaction/entity/transactionReadModels";

const searchQueryMaxLength = 80;

export function normalizeTransactionSearchQuery(value: string) {
  return value.trim().slice(0, searchQueryMaxLength);
}

export const emptyTransactionSearchPage: TransactionSearchPage = {
  items: [],
  nextOffset: null,
  totalCount: 0,
};
