import { transactionPageSize } from "internal/transaction/util/grouping/types";
import type {
  TransactionListItem,
  TransactionSearchPage,
} from "internal/transaction/service/read/transactionReadModels";
import { paginateItems } from "utils/collections";

const searchQueryMaxLength = 80;

export function buildTransactionSearchPage(
  items: TransactionListItem[],
  rawQuery: string,
  offset = 0,
): TransactionSearchPage {
  const query = normalizeTransactionSearchQuery(rawQuery);
  const comparableQuery = normalizeSearchComparable(rawQuery);
  const amountQuery = normalizeAmountSearchValue(rawQuery);

  if (!query) return emptyTransactionSearchPage;

  const matchedItems = sortTransactionSearchItems(
    items.filter((item) =>
      matchesSearchQuery(item, comparableQuery, amountQuery),
    ),
  );
  const page = paginateItems(matchedItems, offset, transactionPageSize);

  return {
    items: page.items,
    nextOffset: page.nextOffset,
    totalCount: page.totalCount,
  };
}

export function normalizeTransactionSearchQuery(value: string) {
  return value.trim().slice(0, searchQueryMaxLength);
}

function normalizeSearchComparable(value: string) {
  return normalizeTransactionSearchQuery(value).toLowerCase();
}

function matchesSearchQuery(
  item: TransactionListItem,
  query: string,
  amountQuery: string,
) {
  return (
    matchesText(item.merchant_name, query) ||
    matchesText(item.note, query) ||
    matchesText(item.recorder_name, query) ||
    matchesAmount(item, amountQuery)
  );
}

function matchesText(value: string | null | undefined, query: string) {
  return normalizeSearchComparable(value ?? "").includes(query);
}

function matchesAmount(item: TransactionListItem, amountQuery: string) {
  if (!amountQuery) return false;

  return [item.amount, ...item.categoryItems.map((category) => category.amount)]
    .map(normalizeAmountSearchValue)
    .some((amount) => amount.includes(amountQuery));
}

function normalizeAmountSearchValue(value: string) {
  const normalized = value.replace(/[\s,，¥￥円]/g, "").trim();

  return /\d/.test(normalized) ? normalized : "";
}

function sortTransactionSearchItems(items: TransactionListItem[]) {
  return [...items].sort(compareTransactionSearchItemDesc);
}

function compareTransactionSearchItemDesc(
  itemA: TransactionListItem,
  itemB: TransactionListItem,
) {
  const transactionTimeDiff = compareDateTextDesc(
    itemA.transaction_at,
    itemB.transaction_at,
  );
  if (transactionTimeDiff !== 0) return transactionTimeDiff;

  const createdTimeDiff = compareDateTextDesc(
    itemA.created_at,
    itemB.created_at,
  );
  if (createdTimeDiff !== 0) return createdTimeDiff;

  return itemB.id.localeCompare(itemA.id);
}

function compareDateTextDesc(dateA: string, dateB: string) {
  return new Date(dateB).getTime() - new Date(dateA).getTime();
}

export const emptyTransactionSearchPage: TransactionSearchPage = {
  items: [],
  nextOffset: null,
  totalCount: 0,
};
