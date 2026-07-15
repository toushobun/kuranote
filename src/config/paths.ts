import type { TransactionRecordType } from "types/transactions";

export const routePaths = {
  accounts: "/accounts",
  categories: "/categories",
  dashboard: "/dashboard",
  home: "/",
  ledgers: "/ledgers",
  ledgersNew: "/ledgers/new",
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

export const accountResultValues = {
  archived: "archived",
  created: "created",
  updated: "updated",
} as const;

export const ledgerSettingsResultValues = {
  updated: "updated",
} as const;

export const ledgerSwitchResultValues = {
  switched: "switched",
} as const;

export const ledgerInviteErrorOperations = {
  create: "create",
  replace: "replace",
  revoke: "revoke",
} as const;

type TransactionResultValue =
  (typeof transactionResultValues)[keyof typeof transactionResultValues];

type AccountResultValue =
  (typeof accountResultValues)[keyof typeof accountResultValues];

type LedgerSettingsResultValue =
  (typeof ledgerSettingsResultValues)[keyof typeof ledgerSettingsResultValues];

export type LedgerSwitchResultValue =
  (typeof ledgerSwitchResultValues)[keyof typeof ledgerSwitchResultValues];

export type LedgerInviteErrorOperation =
  (typeof ledgerInviteErrorOperations)[keyof typeof ledgerInviteErrorOperations];

export const bottomNavigationRouteGroups = {
  left: [
    { href: routePaths.dashboard, label: "首页" },
    { href: routePaths.transactions, label: "明细" },
  ],
  right: [
    { href: routePaths.statistics, label: "统计" },
    { href: routePaths.settings, label: "我的" },
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

export function transactionsResultHref(result: TransactionResultValue) {
  return routeWithQuery(routePaths.transactions, { result });
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

export function ledgerCreateErrorHref(error: string) {
  return routeWithQuery(routePaths.ledgersNew, {
    error,
    errorKey: crypto.randomUUID(),
  });
}

export function ledgersErrorHref(error: string) {
  return routeWithQuery(routePaths.ledgers, {
    error,
    errorKey: crypto.randomUUID(),
  });
}

export function ledgersResultHref(result: LedgerSwitchResultValue) {
  return routeWithQuery(routePaths.ledgers, { result });
}

export function ledgerSettingsHref(ledgerId: string) {
  return `${routePaths.ledgers}/${encodeURIComponent(ledgerId)}/settings`;
}

export function ledgerSettingsErrorHref(ledgerId: string, error: string) {
  const searchParams = new URLSearchParams({
    error,
    errorKey: crypto.randomUUID(),
  });

  return `${ledgerSettingsHref(ledgerId)}?${searchParams.toString()}`;
}

export function ledgerInviteErrorHref(
  ledgerId: string,
  error: string,
  operation: LedgerInviteErrorOperation,
) {
  const searchParams = new URLSearchParams({
    inviteError: error,
    inviteErrorKey: crypto.randomUUID(),
    inviteOperation: operation,
  });

  return `${ledgerSettingsHref(ledgerId)}?${searchParams.toString()}`;
}

export function ledgerSettingsResultHref(
  ledgerId: string,
  result: LedgerSettingsResultValue,
) {
  const searchParams = new URLSearchParams({ result });

  return `${ledgerSettingsHref(ledgerId)}?${searchParams.toString()}`;
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
  // errorKey 保证每次错误 redirect 的 URL 都不同，即使 error 码相同，
  // 前端也能区分出这是新的一次错误事件，而不是同一次错误的重复渲染。
  return routeWithQuery(routePaths.accounts, {
    error,
    errorKey: crypto.randomUUID(),
  });
}

export function accountsResultHref(result: AccountResultValue) {
  return routeWithQuery(routePaths.accounts, { result });
}

export function categoriesErrorHref(error: string, categoryId?: string | null) {
  return routeWithQuery(routePaths.categories, { error, categoryId });
}

export function merchantsErrorHref(error: string, merchantId?: string | null) {
  return routeWithQuery(routePaths.merchants, { error, merchantId });
}
