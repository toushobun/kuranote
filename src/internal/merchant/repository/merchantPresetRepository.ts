import type { buildLedgerSetupMerchantPayload } from "internal/ledger";
import {
  merchantErrorCodes,
  merchantErrorMessages,
} from "internal/merchant/errors";
import {
  AuthenticationError,
  AuthorizationError,
  ValidationError,
} from "internal/shared/errors/appError";
import type { Logger } from "internal/shared/logging/logger";
import type { AuthenticatedSupabaseClient } from "internal/shared/supabase/authenticatedClient";
import { readAllPages } from "internal/shared/supabase/readAllPages";
import { toRepositoryError } from "internal/shared/supabase/repositoryError";
import {
  findRpcBusinessError,
  type RpcErrorLike,
} from "internal/shared/supabase/rpcError";

export interface MerchantPresetRepository {
  getCurrency(ledgerId: string): Promise<string>;
  listExistingNames(ledgerId: string): Promise<string[]>;
  add(input: {
    ledgerId: string;
    currency: string;
    payload: ReturnType<typeof buildLedgerSetupMerchantPayload>;
  }): Promise<number>;
}

export function createMerchantPresetRepository(
  supabase: AuthenticatedSupabaseClient,
  logger: Logger,
): MerchantPresetRepository {
  function fail(error: RpcErrorLike | null): never {
    const code = findRpcBusinessError(error, {
      auth_required: merchantErrorCodes.authRequired,
      permission_denied: merchantErrorCodes.permissionDenied,
      merchant_preset_invalid: merchantErrorCodes.merchantPresetInvalid,
    });
    if (code === merchantErrorCodes.authRequired)
      throw new AuthenticationError(code, merchantErrorMessages[code]);
    if (code === merchantErrorCodes.permissionDenied)
      throw new AuthorizationError(code, merchantErrorMessages[code]);
    if (code === merchantErrorCodes.merchantPresetInvalid)
      throw new ValidationError(code, merchantErrorMessages[code]);
    logger.error("[merchant] preset repository operation failed", { error });
    throw toRepositoryError(
      merchantErrorCodes.merchantPresetAddFailed,
      merchantErrorMessages[merchantErrorCodes.merchantPresetAddFailed],
    );
  }
  return {
    async getCurrency(ledgerId) {
      const { data, error } = await supabase
        .from("ledger")
        .select("base_currency")
        .eq("id", ledgerId)
        .single();
      if (error || !data || typeof data.base_currency !== "string") fail(error);
      return data.base_currency;
    },
    async listExistingNames(ledgerId) {
      // 归档商家仍属账本已有数据；名称与所有别名都参与判重。
      const merchants = await readAllPages(async (offset, limit) => {
        const { data, error } = await supabase
          .from("merchant")
          .select("name")
          .eq("ledger_id", ledgerId)
          .order("id")
          .range(offset, offset + limit - 1);
        if (error) fail(error);
        return (data ?? []) as { name: string }[];
      });
      const aliases = await readAllPages(async (offset, limit) => {
        const { data, error } = await supabase
          .from("merchant_alias")
          .select("alias, merchant!inner(ledger_id)")
          .eq("merchant.ledger_id", ledgerId)
          .order("id")
          .range(offset, offset + limit - 1);
        if (error) fail(error);
        return (data ?? []) as { alias: string }[];
      });
      return [
        ...merchants.map(({ name }) => name),
        ...aliases.map(({ alias }) => alias),
      ];
    },
    async add({ ledgerId, currency, payload }) {
      const { data, error } = await supabase.rpc("add_merchant_presets", {
        p_ledger_id: ledgerId,
        p_currency: currency,
        p_payload: { accounts: [], specialStatusEnabled: false, ...payload },
      });
      if (error) fail(error);
      if (typeof data !== "number" || !Number.isSafeInteger(data) || data < 0)
        fail(null);
      return data;
    },
  };
}
