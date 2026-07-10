import type { CurrentLedgerRole } from "lib/ledger/current-ledger";
import { createClient } from "lib/supabase/server";
import {
  ledgerSettingsErrorCodes,
  type LedgerSettingsErrorCode,
} from "server/errors/ledgerSettings";
import { mapRpcBusinessError } from "server/services/rpcError";
import type { ServiceResult } from "server/services/serviceResult";
import type { ThemeColorKey } from "theme/themeColorTokens";

export type UpdateLedgerMemberSettingsParams = {
  displayColor: ThemeColorKey;
  displayName: string;
  role: CurrentLedgerRole;
  userId: string;
};

export type UpdateLedgerBaseSettingsParams = {
  baseCurrency: string;
  ledgerName: string;
};

export type UpdateLedgerSettingsParams = {
  ledgerId: string;
  ledgerSettings: UpdateLedgerBaseSettingsParams | null;
  memberSettings: UpdateLedgerMemberSettingsParams | null;
  userId: string;
};

const memberSettingsRpcErrorMap = {
  display_color_invalid: ledgerSettingsErrorCodes.displayColorInvalid,
  display_name_required: ledgerSettingsErrorCodes.displayNameRequired,
  display_name_too_long: ledgerSettingsErrorCodes.displayNameTooLong,
  member_not_found: ledgerSettingsErrorCodes.memberInvalid,
  permission_denied: ledgerSettingsErrorCodes.permissionDenied,
  role_invalid: ledgerSettingsErrorCodes.roleInvalid,
} as const satisfies Readonly<Record<string, LedgerSettingsErrorCode>>;

export async function updateLedgerSettingsService(
  params: UpdateLedgerSettingsParams,
): Promise<ServiceResult<LedgerSettingsErrorCode>> {
  const supabase = await createClient();

  const [{ data: memberData, error: memberError }, ledgerResult] =
    await Promise.all([
      supabase
        .from("ledger_member")
        .select("role")
        .eq("ledger_id", params.ledgerId)
        .eq("user_id", params.userId)
        .eq("status", "active")
        .maybeSingle(),
      supabase
        .from("ledger")
        .select("id")
        .eq("id", params.ledgerId)
        .eq("is_archived", false)
        .maybeSingle(),
    ]);

  if (memberError || !memberData || ledgerResult.error || !ledgerResult.data) {
    return { ok: false, error: ledgerSettingsErrorCodes.ledgerInvalid };
  }

  const role = typeof memberData.role === "string" ? memberData.role : "member";
  const canEditLedger = role === "owner" || role === "admin";
  const isOwnMemberSettings =
    params.memberSettings !== null &&
    params.memberSettings.userId === params.userId;

  if (!canEditLedger && params.ledgerSettings !== null) {
    return { ok: false, error: ledgerSettingsErrorCodes.permissionDenied };
  }

  if (
    !canEditLedger &&
    params.memberSettings !== null &&
    !isOwnMemberSettings
  ) {
    return { ok: false, error: ledgerSettingsErrorCodes.permissionDenied };
  }

  if (canEditLedger && params.ledgerSettings !== null) {
    const { count, error } = await supabase
      .from("ledger")
      .update(
        {
          base_currency: params.ledgerSettings.baseCurrency,
          name: params.ledgerSettings.ledgerName,
          updated_by: params.userId,
        },
        { count: "exact" },
      )
      .eq("id", params.ledgerId)
      .eq("is_archived", false);

    if (error || count !== 1) {
      return { ok: false, error: ledgerSettingsErrorCodes.updateFailed };
    }
  }

  if (params.memberSettings) {
    const { error } = await supabase.rpc("update_ledger_member_settings", {
      p_display_color: params.memberSettings.displayColor,
      p_display_name: params.memberSettings.displayName,
      p_ledger_id: params.ledgerId,
      p_member_user_id: params.memberSettings.userId,
      p_role: params.memberSettings.role,
    });

    if (error) {
      return {
        error: mapRpcBusinessError(
          error,
          memberSettingsRpcErrorMap,
          ledgerSettingsErrorCodes.updateFailed,
        ),
        ok: false,
      };
    }
  }

  return { ok: true };
}
