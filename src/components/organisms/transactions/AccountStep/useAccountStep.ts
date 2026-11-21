"use client";
import type { AccountStepProps } from "./AccountStep.types";

export function useAccountStep({
  accounts,
  recommendedAccountIds = [],
  onSelect,
}: AccountStepProps) {
  const recommended = recommendedAccountIds.flatMap((id) =>
    accounts.filter((account) => account.id === id),
  );
  const others = accounts.filter(
    (account) => !recommended.some((item) => item.id === account.id),
  );

  async function selectAccount(value: (typeof accounts)[number]) {
    onSelect(value);
    return true;
  }

  return { recommended, others, busy: false, selectAccount };
}
