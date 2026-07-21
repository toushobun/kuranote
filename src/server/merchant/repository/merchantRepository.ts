import type { MerchantSummary } from "server/merchant/entity/merchantSummary";
import { merchantErrorCodes } from "server/merchant/errors";
import { ConflictError } from "server/shared/errors/appError";
import type { Logger } from "server/shared/logging/logger";
import type { AuthenticatedSupabaseClient } from "server/shared/supabase/authenticatedClient";
import { toRepositoryError } from "server/shared/supabase/repositoryError";
import type { MerchantAliasRow, MerchantRow } from "types/merchants";
import { attachAliases } from "utils/merchants";

export type CreateMerchantInput = {
  ledgerId: string;
  name: string;
  note: string | null;
  siteUrl: string | null;
  userId: string;
};

export type UpdateMerchantInput = CreateMerchantInput & { merchantId: string };
export type ArchiveMerchantInput = {
  ledgerId: string;
  merchantId: string;
  userId: string;
};
export type CreateMerchantAliasInput = {
  alias: string;
  merchantId: string;
  userId: string;
};
export type ArchiveMerchantAliasInput = {
  aliasId: string;
  userId: string;
};

export interface MerchantRepository {
  archiveAlias(input: ArchiveMerchantAliasInput): Promise<boolean>;
  archiveMerchant(input: ArchiveMerchantInput): Promise<boolean>;
  createAlias(input: CreateMerchantAliasInput): Promise<void>;
  createMerchant(input: CreateMerchantInput): Promise<void>;
  findActiveAlias(aliasId: string): Promise<{ merchantId: string } | null>;
  findActiveMerchant(ledgerId: string, merchantId: string): Promise<boolean>;
  findSummariesByIds(
    ledgerId: string,
    merchantIds: string[],
  ): Promise<MerchantSummary[]>;
  listActive(ledgerId: string): Promise<MerchantRow[]>;
  listActiveSummaries(ledgerId: string): Promise<MerchantSummary[]>;
  updateMerchant(input: UpdateMerchantInput): Promise<boolean>;
}

const merchantColumns =
  "id, name, website_url, icon_url, note, sort_order, created_at";
const merchantSummaryColumns = "id, name, icon_url";

export function createSupabaseMerchantRepository(
  supabase: AuthenticatedSupabaseClient,
  logger: Logger,
): MerchantRepository {
  function fail(
    logMessage: string,
    code: string,
    publicMessage: string,
    fields: Record<string, unknown>,
    error: { code?: string | null; message?: string | null },
    conflictCode?: string,
  ): never {
    logger.error(logMessage, {
      ...fields,
      databaseCode: error.code,
      databaseMessage: error.message,
    });
    if (error.code === "23505" && conflictCode) {
      throw new ConflictError(conflictCode, publicMessage);
    }
    throw toRepositoryError(code, publicMessage);
  }

  return {
    async archiveAlias(input) {
      // merchant_alias 没有 ledger_id；别名归属当前账本的不变量由 Service 层在调用前保证。
      const { error, count } = await supabase
        .from("merchant_alias")
        .update(
          {
            archived_at: new Date().toISOString(),
            archived_by: input.userId,
            is_archived: true,
            updated_by: input.userId,
          },
          { count: "exact" },
        )
        .eq("id", input.aliasId)
        .eq("is_archived", false);

      if (error) {
        fail(
          "[merchant] failed to archive merchant alias",
          merchantErrorCodes.aliasArchiveFailed,
          "商家别名归档失败，请稍后重试。",
          { aliasId: input.aliasId },
          error,
        );
      }
      return count === 1;
    },

    async archiveMerchant(input) {
      const { error, count } = await supabase
        .from("merchant")
        .update(
          {
            archived_at: new Date().toISOString(),
            archived_by: input.userId,
            is_archived: true,
            updated_by: input.userId,
          },
          { count: "exact" },
        )
        .eq("id", input.merchantId)
        .eq("ledger_id", input.ledgerId)
        .eq("is_archived", false);

      if (error) {
        fail(
          "[merchant] failed to archive merchant",
          merchantErrorCodes.archiveFailed,
          "商家归档失败，请稍后重试。",
          { ledgerId: input.ledgerId, merchantId: input.merchantId },
          error,
        );
      }
      return count === 1;
    },

    async createAlias(input) {
      const { error } = await supabase.from("merchant_alias").insert({
        alias: input.alias,
        created_by: input.userId,
        merchant_id: input.merchantId,
        sort_order: 0,
        updated_by: input.userId,
      });

      if (error) {
        fail(
          "[merchant] failed to create merchant alias",
          merchantErrorCodes.aliasCreateFailed,
          "商家别名新增失败，请稍后重试。",
          { merchantId: input.merchantId },
          error,
          merchantErrorCodes.aliasCreateFailed,
        );
      }
    },

    async createMerchant(input) {
      const { error } = await supabase.from("merchant").insert({
        created_by: input.userId,
        ledger_id: input.ledgerId,
        name: input.name,
        note: input.note,
        sort_order: 0,
        updated_by: input.userId,
        website_url: input.siteUrl,
      });

      if (error) {
        fail(
          "[merchant] failed to create merchant",
          merchantErrorCodes.createFailed,
          "商家新增失败，请稍后重试。",
          { ledgerId: input.ledgerId },
          error,
          merchantErrorCodes.createFailed,
        );
      }
    },

    async findActiveAlias(aliasId) {
      const { data, error } = await supabase
        .from("merchant_alias")
        .select("merchant_id")
        .eq("id", aliasId)
        .eq("is_archived", false)
        .maybeSingle();

      if (error) {
        fail(
          "[merchant] failed to load merchant alias",
          merchantErrorCodes.merchantAliasReadFailed,
          "商家别名读取失败，请稍后重试。",
          { aliasId },
          error,
        );
      }
      return data ? { merchantId: data.merchant_id } : null;
    },

    async findActiveMerchant(ledgerId, merchantId) {
      const { data, error } = await supabase
        .from("merchant")
        .select("id")
        .eq("id", merchantId)
        .eq("ledger_id", ledgerId)
        .eq("is_archived", false)
        .maybeSingle();

      if (error) {
        fail(
          "[merchant] failed to load merchant",
          merchantErrorCodes.merchantReadFailed,
          "商家读取失败，请稍后重试。",
          { ledgerId, merchantId },
          error,
        );
      }
      return Boolean(data);
    },

    async findSummariesByIds(ledgerId, merchantIds) {
      if (merchantIds.length === 0) return [];

      const { data, error } = await supabase
        .from("merchant")
        .select(merchantSummaryColumns)
        .eq("ledger_id", ledgerId)
        .in("id", merchantIds);

      if (error) {
        fail(
          "[merchant] failed to load merchant summaries",
          merchantErrorCodes.merchantListFailed,
          "商家列表读取失败，请稍后重试。",
          { ledgerId, merchantCount: merchantIds.length },
          error,
        );
      }
      return (data ?? []) as MerchantSummary[];
    },

    async listActive(ledgerId) {
      const { data: merchantData, error: merchantError } = await supabase
        .from("merchant")
        .select(merchantColumns)
        .eq("ledger_id", ledgerId)
        .eq("is_archived", false)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });

      if (merchantError) {
        fail(
          "[merchant] failed to load merchants",
          merchantErrorCodes.merchantListFailed,
          "商家列表读取失败，请稍后重试。",
          { ledgerId },
          merchantError,
        );
      }

      const merchants = (merchantData ?? []).map((merchant) => ({
        ...merchant,
        aliases: [],
      })) as MerchantRow[];
      const merchantIds = merchants.map((merchant) => merchant.id);
      if (merchantIds.length === 0) return merchants;

      const { data: aliasData, error: aliasError } = await supabase
        .from("merchant_alias")
        .select("id, merchant_id, alias, sort_order, created_at")
        .in("merchant_id", merchantIds)
        .eq("is_archived", false)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });

      if (aliasError) {
        fail(
          "[merchant] failed to load merchant aliases",
          merchantErrorCodes.merchantAliasListFailed,
          "商家别名读取失败，请稍后重试。",
          { ledgerId, merchantCount: merchantIds.length },
          aliasError,
        );
      }

      return attachAliases(merchants, (aliasData ?? []) as MerchantAliasRow[]);
    },

    async listActiveSummaries(ledgerId) {
      const { data, error } = await supabase
        .from("merchant")
        .select(merchantSummaryColumns)
        .eq("ledger_id", ledgerId)
        .eq("is_archived", false)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });

      if (error) {
        fail(
          "[merchant] failed to load active merchant summaries",
          merchantErrorCodes.merchantListFailed,
          "商家列表读取失败，请稍后重试。",
          { ledgerId },
          error,
        );
      }
      return (data ?? []) as MerchantSummary[];
    },

    async updateMerchant(input) {
      const { error, count } = await supabase
        .from("merchant")
        .update(
          {
            name: input.name,
            note: input.note,
            updated_by: input.userId,
            website_url: input.siteUrl,
          },
          { count: "exact" },
        )
        .eq("id", input.merchantId)
        .eq("ledger_id", input.ledgerId)
        .eq("is_archived", false);

      if (error) {
        fail(
          "[merchant] failed to update merchant",
          merchantErrorCodes.updateFailed,
          "商家更新失败，请稍后重试。",
          { ledgerId: input.ledgerId, merchantId: input.merchantId },
          error,
          merchantErrorCodes.updateFailed,
        );
      }
      return count === 1;
    },
  };
}
