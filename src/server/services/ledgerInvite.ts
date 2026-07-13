import { createClient } from "lib/supabase/server";
import {
  ledgerInviteErrorCodes,
  type LedgerInviteErrorCode,
} from "server/errors/ledgerInvite";
import { mapRpcBusinessError } from "server/services/rpcError";
import type { ServiceResult } from "server/services/serviceResult";

export type LedgerInviteStatus =
  | "valid"
  | "already_member"
  | "accepted"
  | "revoked"
  | "invalid";

export type LedgerInvitePreview = {
  inviteRole: "member" | "viewer" | null;
  inviterName: string | null;
  ledgerName: string | null;
  status: LedgerInviteStatus;
};

type CreateInviteResult =
  | { ok: true; token: string }
  | { ok: false; error: LedgerInviteErrorCode };

const inviteErrorMap = {
  auth_required: ledgerInviteErrorCodes.authRequired,
  invite_already_used: ledgerInviteErrorCodes.inviteUsed,
  invite_invalid: ledgerInviteErrorCodes.inviteInvalid,
  permission_denied: ledgerInviteErrorCodes.permissionDenied,
} as const satisfies Readonly<Record<string, LedgerInviteErrorCode>>;

export async function createLedgerInviteService(
  ledgerId: string,
): Promise<CreateInviteResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_ledger_invite", {
    p_ledger_id: ledgerId,
    p_role: "member",
  });

  if (error || !Array.isArray(data) || typeof data[0]?.token !== "string") {
    return {
      error: error
        ? mapRpcBusinessError(
            error,
            inviteErrorMap,
            ledgerInviteErrorCodes.createFailed,
          )
        : ledgerInviteErrorCodes.createFailed,
      ok: false,
    };
  }

  return { ok: true, token: data[0].token };
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
    inviteRole:
      row.invite_role === "viewer" || row.invite_role === "member"
        ? row.invite_role
        : null,
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

function isInviteStatus(value: unknown): value is LedgerInviteStatus {
  return (
    value === "valid" ||
    value === "already_member" ||
    value === "accepted" ||
    value === "revoked" ||
    value === "invalid"
  );
}
