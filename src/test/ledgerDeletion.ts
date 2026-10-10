import type { LedgerDeletionImpact } from "internal/ledger";

export const ledgerDeletionFixture = {
  ledger: {
    id: "00000000-0000-4000-8000-000000000032",
    name: "我们家",
    isCurrent: true,
  },
  impact: {
    itemCount: 1284,
    accountCount: 6,
    merchantCount: 32,
    memberNames: ["妈妈", "宝宝"],
  } satisfies LedgerDeletionImpact,
};
export const emptyLedgerDeletionImpact: LedgerDeletionImpact = {
  itemCount: 0,
  accountCount: 0,
  merchantCount: 0,
  memberNames: [],
};
