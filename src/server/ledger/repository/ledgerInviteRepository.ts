import {
  ledgerInviteErrorCodes,
  type LedgerInviteErrorCode,
} from "server/errors/ledgerInvite";
import {
  mapRpcBusinessError,
  type RpcErrorLike,
} from "server/services/rpcError";
import type { AuthenticatedSupabaseClient } from "server/shared/supabase/authenticatedClient";

export type LedgerInviteAcceptResult =
  | { ok: true }
  | { ok: false; code: LedgerInviteErrorCode };

export interface LedgerInviteRepository {
  accept(token: string): Promise<LedgerInviteAcceptResult>;
}

const acceptErrorMap = {
  auth_required: ledgerInviteErrorCodes.authRequired,
  invite_already_revoked: ledgerInviteErrorCodes.inviteAlreadyRevoked,
  invite_already_used: ledgerInviteErrorCodes.inviteUsed,
  invite_invalid: ledgerInviteErrorCodes.inviteInvalid,
  invite_role_invalid: ledgerInviteErrorCodes.inviteRoleInvalid,
  permission_denied: ledgerInviteErrorCodes.permissionDenied,
} as const satisfies Readonly<Record<string, LedgerInviteErrorCode>>;

function logUnexpectedRpcError(operation: string, error: RpcErrorLike): void {
  console.error(`[ledger] ${operation} failed`, {
    code: error.code ?? null,
    hint: error.hint ?? null,
    message: error.message ?? null,
  });
}

export function createSupabaseLedgerInviteRepository(
  supabase: AuthenticatedSupabaseClient,
): LedgerInviteRepository {
  return {
    async accept(token) {
      const { error } = await supabase.rpc("accept_ledger_invite", {
        p_token: token,
      });

      if (error) {
        const code = mapRpcBusinessError(
          error,
          acceptErrorMap,
          ledgerInviteErrorCodes.acceptFailed,
        );

        if (code === ledgerInviteErrorCodes.acceptFailed) {
          logUnexpectedRpcError("accept_ledger_invite", error);
        }

        return { code, ok: false };
      }

      return { ok: true };
    },
  };
}
