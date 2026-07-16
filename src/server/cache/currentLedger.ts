import { revalidatePath } from "next/cache";

import { routePaths } from "config/paths";

export const currentLedgerRevalidatePaths = [
  routePaths.dashboard,
  routePaths.transactions,
  routePaths.transactionsNew,
  routePaths.transactionsSearch,
  routePaths.accounts,
  routePaths.categories,
  routePaths.merchants,
  routePaths.statistics,
  routePaths.settings,
  routePaths.ledgers,
] as const;

export function revalidateCurrentLedgerPaths() {
  currentLedgerRevalidatePaths.forEach((path) => {
    revalidatePath(path);
  });
}
