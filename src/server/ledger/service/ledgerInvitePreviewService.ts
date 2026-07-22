import {
  invalidLedgerInvitePreview,
  type LedgerInvitePreview,
  type LedgerInviteStatus,
} from "server/ledger/entity/ledgerInvitePreview";
import type { LedgerInvitePreviewRepository } from "server/ledger/repository/ledgerInvitePreviewRepository";
import { isLedgerInviteRole } from "types/ledgers";

export interface LedgerInvitePreviewService {
  load(token: string): Promise<LedgerInvitePreview>;
}

export function createLedgerInvitePreviewService(
  repository: LedgerInvitePreviewRepository,
): LedgerInvitePreviewService {
  return {
    async load(token) {
      const row = await repository.findByToken(token);

      if (!row) return invalidLedgerInvitePreview;

      return {
        inviteRole: isLedgerInviteRole(row.invite_role)
          ? row.invite_role
          : null,
        inviterName:
          typeof row.inviter_name === "string" ? row.inviter_name : null,
        ledgerName:
          typeof row.ledger_name === "string" ? row.ledger_name : null,
        status: isInviteStatus(row.invite_status)
          ? row.invite_status
          : "invalid",
      };
    },
  };
}

function isInviteStatus(value: unknown): value is LedgerInviteStatus {
  return (
    value === "valid" ||
    value === "already_member" ||
    value === "accepted" ||
    value === "revoked" ||
    value === "invalid"
  );
}
