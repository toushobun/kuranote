import type { TransactionRecordType } from "types/transactions";

export const routePaths = {
  accounts: "/accounts",
  categories: "/categories",
  dashboard: "/dashboard",
  home: "/",
  ledgerSetup: "/ledger-setup",
  ledgers: "/ledgers",
  login: "/login",
  merchants: "/merchants",
  register: "/register",
  settings: "/settings",
  statistics: "/statistics",
  transactions: "/transactions",
  transactionsNew: "/transactions/new",
  transactionsSearch: "/transactions/search",
} as const;

export type AppRouteKey = keyof typeof routePaths;
export type AppRoutePath = (typeof routePaths)[AppRouteKey];

export const transactionEditPagePath =
  "/transactions/[transactionRecordId]/edit";

export const transactionResultValues = {
  created: "created",
  deleted: "deleted",
  updated: "updated",
} as const;

type TransactionResultValue =
  (typeof transactionResultValues)[keyof typeof transactionResultValues];

export const bottomNavigationRouteGroups = {
  left: [
    { href: routePaths.dashboard, label: "首页" },
    { href: routePaths.transactions, label: "明细" },
  ],
  right: [
    { href: routePaths.statistics, label: "统计" },
    { href: routePaths.settings, label: "设置" },
  ],
} as const;

export function routeWithQuery(
  path: AppRoutePath,
  params: Record<string, string | null | undefined>,
) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value) {
      searchParams.set(key, value);
    }
  }

  const query = searchParams.toString();
  return query ? `${path}?${query}` : path;
}

export function statisticsMonthHref(month: string) {
  return routeWithQuery(routePaths.statistics, { month });
}

export function transactionsMonthHref(
  month: string,
  result?: TransactionResultValue,
) {
  return routeWithQuery(routePaths.transactions, { month, result });
}

export function transactionsSearchHref(query: string) {
  return routeWithQuery(routePaths.transactionsSearch, { q: query });
}

export function transactionEditHref(
  transactionRecordId: string,
  returnTo?: string | null,
) {
  const editPath = `${routePaths.transactions}/${encodeURIComponent(
    transactionRecordId,
  )}/edit`;

  if (!returnTo) return editPath;

  const searchParams = new URLSearchParams({ returnTo });
  return `${editPath}?${searchParams.toString()}`;
}

export function transactionsErrorHref(error: string) {
  return routeWithQuery(routePaths.transactions, { error });
}

export function newTransactionErrorHref(
  error: string,
  type?: TransactionRecordType | null,
) {
  return routeWithQuery(routePaths.transactionsNew, { error, type });
}

export function editTransactionErrorHref(
  transactionRecordId: string,
  error: string,
  returnTo?: string | null,
) {
  const searchParams = new URLSearchParams({ error });

  if (returnTo) {
    searchParams.set("returnTo", returnTo);
  }

  return `${transactionEditHref(transactionRecordId)}?${searchParams.toString()}`;
}

export function accountsErrorHref(error: string) {
  return routeWithQuery(routePaths.accounts, { error });
}

export function categoriesErrorHref(error: string, categoryId?: string | null) {
  return routeWithQuery(routePaths.categories, { error, categoryId });
}

export function ledgerSetupErrorHref(error: string) {
  return routeWithQuery(routePaths.ledgerSetup, { error });
}

export function merchantsErrorHref(error: string, merchantId?: string | null) {
  return routeWithQuery(routePaths.merchants, { error, merchantId });
}
