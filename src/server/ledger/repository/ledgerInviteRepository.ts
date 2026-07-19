import {
  ledgerInviteErrorCodes,
  type LedgerInviteErrorCode,
} from "server/errors/ledgerInvite";
import {
  mapRpcBusinessError,
  type RpcErrorLike,
} from "server/services/rpcError";
import type { Logger } from "server/shared/logging/logger";
import type { AuthenticatedSupabaseClient } from "server/shared/supabase/authenticatedClient";
import { isLedgerInviteRole, type LedgerInviteRole } from "types/ledgers";

export type LedgerInviteWriteResult =
  | { ok: true }
  | { ok: false; code: LedgerInviteErrorCode };

export type CreateLedgerInviteResult =
  | { inviteId: string; ok: true; role: LedgerInviteRole; token: string }
  | { ok: false; code: LedgerInviteErrorCode };

export type PendingLedgerInvite = {
  createdAt: string;
  id: string;
  role: LedgerInviteRole;
  token: string | null;
};

export type ListPendingLedgerInvitesResult =
  | { invites: PendingLedgerInvite[]; ok: true }
  | { ok: false; code: LedgerInviteErrorCode };

export interface LedgerInviteRepository {
  accept(token: string): Promise<LedgerInviteWriteResult>;
  getMemberRole(
    ledgerId: string,
    userId: string,
  ): Promise<"owner" | "admin" | "member" | "viewer" | null>;
  create(
    ledgerId: string,
    role: LedgerInviteRole,
  ): Promise<CreateLedgerInviteResult>;
  revoke(ledgerId: string, inviteId: string): Promise<LedgerInviteWriteResult>;
  listPending(ledgerId: string): Promise<ListPendingLedgerInvitesResult>;
}

const inviteErrorMap = {
  auth_required: ledgerInviteErrorCodes.authRequired,
  invite_already_revoked: ledgerInviteErrorCodes.inviteAlreadyRevoked,
  invite_already_used: ledgerInviteErrorCodes.inviteUsed,
  invite_invalid: ledgerInviteErrorCodes.inviteInvalid,
  invite_role_invalid: ledgerInviteErrorCodes.inviteRoleInvalid,
  permission_denied: ledgerInviteErrorCodes.permissionDenied,
} as const satisfies Readonly<Record<string, LedgerInviteErrorCode>>;

function logUnexpectedRpcError(
  logger: Logger,
  operation: string,
  error: RpcErrorLike,
): void {
  logger.error(`[ledger] ${operation} failed`, {
    code: error.code ?? null,
    hint: error.hint ?? null,
    message: error.message ?? null,
  });
}

export function createSupabaseLedgerInviteRepository(
  supabase: AuthenticatedSupabaseClient,
  logger: Logger = {
    error: () => undefined,
    info: () => undefined,
    warn: () => undefined,
  },
): LedgerInviteRepository {
  return {
    async getMemberRole(ledgerId, userId) {
      const { data, error } = await supabase
        .from("ledger_member")
        .select("role")
        .eq("ledger_id", ledgerId)
        .eq("user_id", userId)
        .eq("status", "active")
        .maybeSingle();

      if (error || !data) return null;
      return data.role === "owner" ||
        data.role === "admin" ||
        data.role === "member" ||
        data.role === "viewer"
        ? data.role
        : null;
    },

    async accept(token) {
      const { error } = await supabase.rpc("accept_ledger_invite", {
        p_token: token,
      });

      if (error) {
        const code = mapRpcBusinessError(
          error,
          inviteErrorMap,
          ledgerInviteErrorCodes.acceptFailed,
        );

        if (code === ledgerInviteErrorCodes.acceptFailed) {
          logUnexpectedRpcError(logger, "accept_ledger_invite", error);
        }

        return { code, ok: false };
      }

      return { ok: true };
    },

    async create(ledgerId, role) {
      const { data, error } = await supabase.rpc("create_ledger_invite_v2", {
        p_ledger_id: ledgerId,
        p_role: role,
      });

      if (error) {
        const code = mapRpcBusinessError(
          error,
          inviteErrorMap,
          ledgerInviteErrorCodes.createFailed,
        );

        if (code === ledgerInviteErrorCodes.createFailed) {
          logUnexpectedRpcError(logger, "create_ledger_invite_v2", error);
        }

        return { code, ok: false };
      }

      const row = Array.isArray(data) ? data[0] : null;

      if (
        typeof row?.invite_id !== "string" ||
        typeof row?.token !== "string" ||
        !isLedgerInviteRole(row?.invite_role)
      ) {
        logger.error("[ledger] create_ledger_invite_v2 returned invalid data", {
          isArray: Array.isArray(data),
          rowCount: Array.isArray(data) ? data.length : null,
        });
        return { code: ledgerInviteErrorCodes.createFailed, ok: false };
      }

      return {
        inviteId: row.invite_id,
        ok: true,
        role: row.invite_role,
        token: row.token,
      };
    },

    async revoke(ledgerId, inviteId) {
      const { error } = await supabase.rpc("revoke_ledger_invite", {
        p_invite_id: inviteId,
        p_ledger_id: ledgerId,
      });

      if (error) {
        const code = mapRpcBusinessError(
          error,
          inviteErrorMap,
          ledgerInviteErrorCodes.revokeFailed,
        );

        if (code === ledgerInviteErrorCodes.revokeFailed) {
          logUnexpectedRpcError(logger, "revoke_ledger_invite", error);
        }

        return { code, ok: false };
      }

      return { ok: true };
    },

    async listPending(ledgerId) {
      const { data, error } = await supabase.rpc(
        "list_pending_ledger_invites",
        { p_ledger_id: ledgerId },
      );

      if (error || !Array.isArray(data)) {
        const code = error
          ? mapRpcBusinessError(
              error,
              inviteErrorMap,
              ledgerInviteErrorCodes.loadFailed,
            )
          : ledgerInviteErrorCodes.loadFailed;
        return { code, ok: false };
      }

      const invites = data.flatMap((row) => {
        if (
          typeof row.invite_id !== "string" ||
          typeof row.created_at !== "string" ||
          !isLedgerInviteRole(row.invite_role)
        ) {
          return [];
        }

        return [
          {
            createdAt: row.created_at,
            id: row.invite_id,
            role: row.invite_role,
            token:
              typeof row.invite_token === "string" ? row.invite_token : null,
          },
        ];
      });

      return { invites, ok: true };
    },
  };
}
