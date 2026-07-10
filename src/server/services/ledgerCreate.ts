import { createClient } from "lib/supabase/server";
import {
  ledgerCreateErrorCodes,
  type LedgerCreateErrorCode,
} from "server/errors/ledgerCreate";
import type { ServiceResult } from "server/services/serviceResult";
import type { ThemeColorKey } from "theme/themeColorTokens";

export type CreateLedgerParams = {
  baseCurrency: string;
  displayColor: ThemeColorKey;
  displayName: string;
  ledgerName: string;
};

type SupabaseErrorLike = {
  message?: string;
};

function mapCreateLedgerError(
  error: SupabaseErrorLike | null,
): LedgerCreateErrorCode {
  const message = error?.message ?? "";

  if (message.includes("ledger_name_required")) {
    return ledgerCreateErrorCodes.nameRequired;
  }

  if (message.includes("ledger_name_too_long")) {
    return ledgerCreateErrorCodes.nameTooLong;
  }

  if (message.includes("currency_invalid")) {
    return ledgerCreateErrorCodes.currencyInvalid;
  }

  if (message.includes("display_name_required")) {
    return ledgerCreateErrorCodes.displayNameRequired;
  }

  if (message.includes("display_name_too_long")) {
    return ledgerCreateErrorCodes.displayNameTooLong;
  }

  if (message.includes("display_color_invalid")) {
    return ledgerCreateErrorCodes.displayColorInvalid;
  }

  return ledgerCreateErrorCodes.createFailed;
}

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
    return { error: mapCreateLedgerError(error), ok: false };
  }

  return { ok: true };
}
