import type { buildLedgerSetupMerchantPayload } from "internal/ledger";
import { isLedgerSetupRegion, type LedgerSetupRegion } from "internal/ledger";
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
  getRegion(ledgerId: string): Promise<LedgerSetupRegion | null>;
  listExistingNames(
    ledgerId: string,
  ): Promise<{ names: string[]; aliases: string[] }>;
  add(input: {
    ledgerId: string;
    regions: LedgerSetupRegion[];
    payload: ReturnType<typeof buildLedgerSetupMerchantPayload>;
  }): Promise<number>;
}

export function createMerchantPresetRepository(
  supabase: AuthenticatedSupabaseClient,
  logger: Logger,
): MerchantPresetRepository {
  function fail(
    error: RpcErrorLike | null,
    fallback:
      | typeof merchantErrorCodes.merchantPresetLoadFailed
      | typeof merchantErrorCodes.merchantPresetAddFailed = merchantErrorCodes.merchantPresetLoadFailed,
  ): never {
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
    throw toRepositoryError(fallback, merchantErrorMessages[fallback]);
  }
  return {
    async getRegion(ledgerId) {
      const { data, error } = await supabase
        .from("ledger")
        .select("living_region")
        .eq("id", ledgerId)
        .single();
      if (
        error ||
        !data ||
        (data.living_region !== null &&
          !isLedgerSetupRegion(data.living_region))
      )
        fail(error);
      return data.living_region;
    },
    async listExistingNames(ledgerId) {
      // 归档等同删除；仅按有效商家和有效别名判重，允许从预设重新添加。
      const merchants = await readAllPages(async (offset, limit) => {
        const { data, error } = await supabase
          .from("merchant")
          .select("name")
          .eq("ledger_id", ledgerId)
          .eq("is_archived", false)
          .order("id")
          .range(offset, offset + limit - 1);
        if (error) fail(error);
        return (data ?? []) as { name: string }[];
      });
      const aliases = await readAllPages(async (offset, limit) => {
        const { data, error } = await supabase
          .from("merchant_alias")
          .select("alias, merchant!inner(ledger_id, is_archived)")
          .eq("merchant.ledger_id", ledgerId)
          .eq("is_archived", false)
          .eq("merchant.is_archived", false)
          .order("id")
          .range(offset, offset + limit - 1);
        if (error) fail(error);
        return (data ?? []) as { alias: string }[];
      });
      return {
        names: merchants.map(({ name }) => name),
        aliases: aliases.map(({ alias }) => alias),
      };
    },
    async add({ ledgerId, regions, payload }) {
      const { data, error } = await supabase.rpc("add_merchant_presets", {
        p_ledger_id: ledgerId,
        p_regions: regions,
        // 补齐空账户与功能开关字段，以复用 validate_ledger_setup_completion_payload。
        p_payload: {
          accounts: [],
          multiAccountPaymentEnabled: false,
          specialStatusEnabled: false,
          ...payload,
        },
      });
      if (error) fail(error, merchantErrorCodes.merchantPresetAddFailed);
      if (typeof data !== "number" || !Number.isSafeInteger(data) || data < 0)
        fail(null, merchantErrorCodes.merchantPresetAddFailed);
      return data;
    },
  };
}
