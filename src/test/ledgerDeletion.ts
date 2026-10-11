import type { LedgerDeletionImpact } from "internal/ledger";
import type { LoadLedgerDeletionImpactAction } from "types/ledgers";

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
    pendingInviteCount: 1,
    memberNames: ["妈妈", "宝宝"],
    placeholderNames: [],
  } satisfies LedgerDeletionImpact,
};
export const emptyLedgerDeletionImpact: LedgerDeletionImpact = {
  itemCount: 0,
  accountCount: 0,
  merchantCount: 0,
  pendingInviteCount: 0,
  memberNames: [],
  placeholderNames: [],
};
/** 立即返回指定影响统计的读取 Action，供测试与 Story 复用。 */
export function loadLedgerDeletionImpactWith(
  impact: LedgerDeletionImpact = ledgerDeletionFixture.impact,
): LoadLedgerDeletionImpactAction {
  return async () => ({ impact });
}
