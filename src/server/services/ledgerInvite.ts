import { createClient } from "lib/supabase/server";
import {
  ledgerInviteErrorCodes,
  type LedgerInviteErrorCode,
} from "server/errors/ledgerInvite";
import {
  mapRpcBusinessError,
  type RpcErrorLike,
} from "server/services/rpcError";
import type { ServiceResult } from "server/services/serviceResult";
import {
  isLedgerInviteRole,
  type LedgerInviteRole,
  type PendingLedgerInvite,
} from "types/ledgers";

export type LedgerInviteStatus =
  | "valid"
  | "already_member"
  | "accepted"
  | "revoked"
  | "invalid";

export type LedgerInvitePreview = {
  inviteRole: LedgerInviteRole | null;
  inviterName: string | null;
  ledgerName: string | null;
  status: LedgerInviteStatus;
};

type CreateInviteResult =
  | { inviteId: string; ok: true; role: LedgerInviteRole; token: string }
  | { ok: false; error: LedgerInviteErrorCode };

type PendingInvitesResult =
  | { ok: true; invites: PendingLedgerInvite[] }
  | { ok: false; error: LedgerInviteErrorCode };

const inviteErrorMap = {
  auth_required: ledgerInviteErrorCodes.authRequired,
  invite_already_revoked: ledgerInviteErrorCodes.inviteAlreadyRevoked,
  invite_already_used: ledgerInviteErrorCodes.inviteUsed,
  invite_invalid: ledgerInviteErrorCodes.inviteInvalid,
  invite_role_invalid: ledgerInviteErrorCodes.inviteRoleInvalid,
  permission_denied: ledgerInviteErrorCodes.permissionDenied,
} as const satisfies Readonly<Record<string, LedgerInviteErrorCode>>;

export async function createLedgerInviteService(
  ledgerId: string,
  role: LedgerInviteRole,
): Promise<CreateInviteResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_ledger_invite_v2", {
    p_ledger_id: ledgerId,
    p_role: role,
  });

  if (error) {
    const mappedError = mapRpcBusinessError(
      error,
      inviteErrorMap,
      ledgerInviteErrorCodes.createFailed,
    );

    if (mappedError === ledgerInviteErrorCodes.createFailed) {
      logUnexpectedRpcError("create_ledger_invite_v2", error);
    }

    return { error: mappedError, ok: false };
  }

  if (
    !Array.isArray(data) ||
    typeof data[0]?.invite_id !== "string" ||
    typeof data[0]?.token !== "string" ||
    !isLedgerInviteRole(data[0]?.invite_role)
  ) {
    console.error(
      "[ledgerInvite] create_ledger_invite_v2 returned invalid data",
      {
        isArray: Array.isArray(data),
        rowCount: Array.isArray(data) ? data.length : null,
      },
    );
    return { error: ledgerInviteErrorCodes.createFailed, ok: false };
  }

  return {
    inviteId: data[0].invite_id,
    ok: true,
    role: data[0].invite_role,
    token: data[0].token,
  };
}

export async function replaceLedgerInviteService(
  ledgerId: string,
  inviteId: string,
): Promise<CreateInviteResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("replace_ledger_invite", {
    p_invite_id: inviteId,
    p_ledger_id: ledgerId,
  });

  if (error) {
    const mappedError = mapRpcBusinessError(
      error,
      inviteErrorMap,
      ledgerInviteErrorCodes.createFailed,
    );
    if (mappedError === ledgerInviteErrorCodes.createFailed) {
      logUnexpectedRpcError("replace_ledger_invite", error);
    }
    return { error: mappedError, ok: false };
  }

  const row = Array.isArray(data) ? data[0] : null;
  if (
    typeof row?.invite_id !== "string" ||
    typeof row.token !== "string" ||
    !isLedgerInviteRole(row.invite_role)
  ) {
    console.error(
      "[ledgerInvite] replace_ledger_invite returned invalid data",
      {
        isArray: Array.isArray(data),
        rowCount: Array.isArray(data) ? data.length : null,
      },
    );
    return { error: ledgerInviteErrorCodes.createFailed, ok: false };
  }

  return {
    inviteId: row.invite_id,
    ok: true,
    role: row.invite_role,
    token: row.token,
  };
}

export async function loadPendingLedgerInvitesService(
  ledgerId: string,
): Promise<PendingInvitesResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("list_pending_ledger_invites", {
    p_ledger_id: ledgerId,
  });

  if (error || !Array.isArray(data)) {
    return {
      error: error
        ? mapRpcBusinessError(
            error,
            inviteErrorMap,
            ledgerInviteErrorCodes.loadFailed,
          )
        : ledgerInviteErrorCodes.loadFailed,
      ok: false,
    };
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
      },
    ];
  });

  return { invites, ok: true };
}

export async function loadLedgerInvitePreview(
  token: string,
): Promise<LedgerInvitePreview> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_ledger_invite_preview", {
    p_token: token,
  });
  const row = Array.isArray(data) ? data[0] : null;

  if (error || !row) {
    return {
      inviteRole: null,
      inviterName: null,
      ledgerName: null,
      status: "invalid",
    };
  }

  return {
    inviteRole: isLedgerInviteRole(row.invite_role) ? row.invite_role : null,
    inviterName: typeof row.inviter_name === "string" ? row.inviter_name : null,
    ledgerName: typeof row.ledger_name === "string" ? row.ledger_name : null,
    status: isInviteStatus(row.invite_status) ? row.invite_status : "invalid",
  };
}

export async function acceptLedgerInviteService(
  token: string,
): Promise<ServiceResult<LedgerInviteErrorCode>> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("accept_ledger_invite", {
    p_token: token,
  });

  if (error) {
    return {
      error: mapRpcBusinessError(
        error,
        inviteErrorMap,
        ledgerInviteErrorCodes.inviteInvalid,
      ),
      ok: false,
    };
  }

  return { ok: true };
}

export async function revokeLedgerInviteService(
  ledgerId: string,
  inviteId: string,
): Promise<ServiceResult<LedgerInviteErrorCode>> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("revoke_ledger_invite", {
    p_invite_id: inviteId,
    p_ledger_id: ledgerId,
  });

  if (error) {
    return {
      error: mapRpcBusinessError(
        error,
        inviteErrorMap,
        ledgerInviteErrorCodes.revokeFailed,
      ),
      ok: false,
    };
  }

  return { ok: true };
}

function logUnexpectedRpcError(operation: string, error: RpcErrorLike): void {
  console.error(`[ledgerInvite] ${operation} failed`, {
    code: error.code ?? null,
    hint: error.hint ?? null,
    message: error.message ?? null,
  });
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
