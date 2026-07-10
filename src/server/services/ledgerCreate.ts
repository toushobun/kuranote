import { createClient } from "lib/supabase/server";
import {
  ledgerCreateErrorCodes,
  type LedgerCreateErrorCode,
} from "server/errors/ledgerCreate";
import { mapRpcBusinessError } from "server/services/rpcError";
import type { ServiceResult } from "server/services/serviceResult";
import type { ThemeColorKey } from "theme/themeColorTokens";

export type CreateLedgerParams = {
  baseCurrency: string;
  displayColor: ThemeColorKey;
  displayName: string;
  ledgerName: string;
};

const createLedgerRpcErrorMap = {
  auth_required: ledgerCreateErrorCodes.authRequired,
  currency_invalid: ledgerCreateErrorCodes.currencyInvalid,
  display_color_invalid: ledgerCreateErrorCodes.displayColorInvalid,
  display_name_required: ledgerCreateErrorCodes.displayNameRequired,
  display_name_too_long: ledgerCreateErrorCodes.displayNameTooLong,
  ledger_name_required: ledgerCreateErrorCodes.nameRequired,
  ledger_name_too_long: ledgerCreateErrorCodes.nameTooLong,
  user_inactive: ledgerCreateErrorCodes.userInactive,
} as const satisfies Readonly<Record<string, LedgerCreateErrorCode>>;

export async function createLedgerService(
  params: CreateLedgerParams,
): Promise<ServiceResult<LedgerCreateErrorCode>> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("create_ledger_with_owner_settings", {
    p_base_currency: params.baseCurrency,
    p_display_color: params.displayColor,
    p_display_name: params.displayName,
    p_name: params.ledgerName,
  });

  if (error) {
    return {
      error: mapRpcBusinessError(
        error,
        createLedgerRpcErrorMap,
        ledgerCreateErrorCodes.createFailed,
      ),
      ok: false,
    };
  }

  return { ok: true };
}
