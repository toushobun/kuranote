import { vi } from "vitest";
import type { CurrentLedgerRole } from "internal/ledger";

export function createLedgerAccessMock(
  role: CurrentLedgerRole | null = "viewer",
) {
  return { getActiveMemberRole: vi.fn().mockResolvedValue(role) };
}
