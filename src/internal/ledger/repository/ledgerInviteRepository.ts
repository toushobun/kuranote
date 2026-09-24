import {
  ledgerInviteErrorCodes,
  type LedgerInviteErrorCode,
} from "internal/ledger/errors/ledgerInvite";
import {
  findRpcBusinessError,
  type RpcErrorLike,
} from "internal/shared/supabase/rpcError";
import type { Logger } from "internal/shared/logging/logger";
import type { AuthenticatedSupabaseClient } from "internal/shared/supabase/authenticatedClient";
import { toRepositoryError } from "internal/shared/supabase/repositoryError";
import {
  isLedgerInviteRole,
  type LedgerInviteRole,
} from "internal/ledger/entity/ledgerInviteRole";

export type LedgerInviteWriteResult =
  | { ok: true }
  | { ok: false; code: LedgerInviteErrorCode };

/**
 * 接受邀请的结果：joined / already_member 为匿名邀请，
 * claimed 为绑定邀请首次认领或同一用户的幂等重放，此时 placeholderId 非空。
 */
export type AcceptedLedgerInvite =
  | {
      ledgerId: string;
      placeholderId: null;
      result: "already_member" | "joined";
    }
  | { ledgerId: string; placeholderId: string; result: "claimed" };

export type AcceptLedgerInviteResult =
  | { invite: AcceptedLedgerInvite; ok: true }
  | { ok: false; code: LedgerInviteErrorCode };

export type CreateLedgerInviteResult =
  | {
      inviteId: string;
      ok: true;
      placeholderId: string | null;
      role: LedgerInviteRole;
      token: string;
    }
  | { ok: false; code: LedgerInviteErrorCode };

export type PendingLedgerInvite = {
  createdAt: string;
  id: string;
  placeholderId: string | null;
  role: LedgerInviteRole;
  token: string | null;
};

export type ListPendingLedgerInvitesResult =
  | { invites: PendingLedgerInvite[]; ok: true }
  | { ok: false; code: LedgerInviteErrorCode };

export interface LedgerInviteRepository {
  accept(token: string): Promise<AcceptLedgerInviteResult>;
  create(
    ledgerId: string,
    role: LedgerInviteRole,
    placeholderId: string | null,
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
  placeholder_already_claimed: ledgerInviteErrorCodes.placeholderAlreadyClaimed,
  placeholder_claim_account_name_conflict:
    ledgerInviteErrorCodes.placeholderClaimAccountNameConflict,
  placeholder_claim_existing_member:
    ledgerInviteErrorCodes.placeholderClaimExistingMember,
  placeholder_invite_pending: ledgerInviteErrorCodes.placeholderInvitePending,
  placeholder_not_found: ledgerInviteErrorCodes.placeholderNotFound,
} as const satisfies Readonly<Record<string, LedgerInviteErrorCode>>;

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

function toAcceptedLedgerInvite(row: unknown): AcceptedLedgerInvite | null {
  if (typeof row !== "object" || row === null) return null;

  const { ledger_id, placeholder_id, result } = row as Record<string, unknown>;
  if (typeof ledger_id !== "string") return null;

  if (result === "claimed" && typeof placeholder_id === "string") {
    return { ledgerId: ledger_id, placeholderId: placeholder_id, result };
  }
  if (
    (result === "joined" || result === "already_member") &&
    placeholder_id === null
  ) {
    return { ledgerId: ledger_id, placeholderId: null, result };
  }
  return null;
}

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
    async accept(token) {
      const { data, error } = await supabase.rpc("accept_ledger_invite", {
        p_token: token,
      });

      if (error) {
        const code = findRpcBusinessError(error, inviteErrorMap);
        if (!code) {
          logUnexpectedRpcError(logger, "accept_ledger_invite", error);
          throw toRepositoryError(
            "ledger_invite_accept_failed",
            "加入账本失败，请稍后重试。",
          );
        }
        return { code, ok: false };
      }

      const accepted = toAcceptedLedgerInvite(
        Array.isArray(data) && data.length === 1 ? data[0] : null,
      );
      if (!accepted) {
        logger.error("[ledger] accept_ledger_invite returned invalid data", {
          isArray: Array.isArray(data),
          rowCount: Array.isArray(data) ? data.length : null,
        });
        throw toRepositoryError(
          "ledger_invite_accept_result_invalid",
          "加入账本失败，请稍后重试。",
        );
      }

      return { invite: accepted, ok: true };
    },

    async create(ledgerId, role, placeholderId) {
      const { data, error } = await supabase.rpc("create_ledger_invite_v2", {
        p_ledger_id: ledgerId,
        p_placeholder_id: placeholderId,
        p_role: role,
      });

      if (error) {
        const code = findRpcBusinessError(error, inviteErrorMap);
        if (!code) {
          logUnexpectedRpcError(logger, "create_ledger_invite_v2", error);
          throw toRepositoryError(
            "ledger_invite_create_failed",
            "邀请链接生成失败，请稍后重试。",
          );
        }
        return { code, ok: false };
      }

      const row = Array.isArray(data) ? data[0] : null;

      if (
        typeof row?.invite_id !== "string" ||
        typeof row?.token !== "string" ||
        !isLedgerInviteRole(row?.invite_role) ||
        !isNullableString(row?.placeholder_id) ||
        row.placeholder_id !== placeholderId
      ) {
        logger.error("[ledger] create_ledger_invite_v2 returned invalid data", {
          isArray: Array.isArray(data),
          rowCount: Array.isArray(data) ? data.length : null,
        });
        throw toRepositoryError(
          "ledger_invite_create_result_invalid",
          "邀请链接生成失败，请稍后重试。",
        );
      }

      return {
        inviteId: row.invite_id,
        ok: true,
        placeholderId: row.placeholder_id,
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
        const code = findRpcBusinessError(error, inviteErrorMap);
        if (!code) {
          logUnexpectedRpcError(logger, "revoke_ledger_invite", error);
          throw toRepositoryError(
            "ledger_invite_revoke_failed",
            "邀请撤销失败，请稍后重试。",
          );
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

      if (error) {
        const code = findRpcBusinessError(error, inviteErrorMap);
        if (code) return { code, ok: false };
        logUnexpectedRpcError(logger, "list_pending_ledger_invites", error);
        throw toRepositoryError(
          "ledger_invite_list_failed",
          "待接受邀请加载失败，请稍后重试。",
        );
      }
      if (!Array.isArray(data)) {
        throw toRepositoryError(
          "ledger_invite_list_result_invalid",
          "待接受邀请加载失败，请稍后重试。",
        );
      }

      const invites = data.flatMap((row) => {
        if (
          typeof row.invite_id !== "string" ||
          typeof row.created_at !== "string" ||
          !isLedgerInviteRole(row.invite_role) ||
          !isNullableString(row.placeholder_id)
        ) {
          return [];
        }

        return [
          {
            createdAt: row.created_at,
            id: row.invite_id,
            placeholderId: row.placeholder_id,
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
