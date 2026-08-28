import type { MerchantSummary } from "internal/merchant/entity/merchantSummary";
import { merchantErrorCodes } from "internal/merchant/errors";
import { ConflictError } from "internal/shared/errors/appError";
import type { Logger } from "internal/shared/logging/logger";
import type { AuthenticatedSupabaseClient } from "internal/shared/supabase/authenticatedClient";
import { toRepositoryError } from "internal/shared/supabase/repositoryError";

type MerchantRow = {
  created_at: string;
  icon_url: string | null;
  id: string;
  name: string;
  note: string | null;
  sort_order: number;
  website_url: string | null;
};

type MerchantAliasRow = {
  alias: string;
  created_at: string;
  id: string;
  is_preferred: boolean;
  merchant_id: string;
  sort_order: number;
};

type MerchantSummaryRow = {
  icon_url: string | null;
  id: string;
  name: string;
};

export type MerchantAliasData = {
  alias: string;
  created_at: string;
  id: string;
  is_preferred: boolean;
  merchant_id: string;
  sort_order: number;
};

export type MerchantData = {
  aliases: MerchantAliasData[];
  created_at: string;
  display_name: string;
  icon_url: string | null;
  id: string;
  name: string;
  note: string | null;
  sort_order: number;
  website_url: string | null;
};

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
export type SetPreferredMerchantAliasInput = {
  aliasId: string | null;
  ledgerId: string;
  merchantId: string;
};

export interface MerchantRepository {
  archiveAlias(input: ArchiveMerchantAliasInput): Promise<boolean>;
  archiveMerchant(input: ArchiveMerchantInput): Promise<boolean>;
  createAlias(input: CreateMerchantAliasInput): Promise<void>;
  createMerchant(input: CreateMerchantInput): Promise<void>;
  findActiveAlias(aliasId: string): Promise<{ merchantId: string } | null>;
  findActiveMerchant(ledgerId: string, merchantId: string): Promise<boolean>;
  findActiveMerchantData(
    ledgerId: string,
    merchantId: string,
  ): Promise<MerchantData | null>;
  findSummariesByIds(
    ledgerId: string,
    merchantIds: string[],
  ): Promise<MerchantSummary[]>;
  listActive(ledgerId: string): Promise<MerchantData[]>;
  listActiveSummaries(ledgerId: string): Promise<MerchantSummary[]>;
  setPreferredAlias(input: SetPreferredMerchantAliasInput): Promise<boolean>;
  updateMerchant(input: UpdateMerchantInput): Promise<boolean>;
}

const merchantColumns =
  "id, name, website_url, icon_url, note, sort_order, created_at";
const merchantSummaryColumns = "id, name, icon_url";

function toMerchantData(row: MerchantRow): MerchantData {
  return {
    aliases: [],
    created_at: row.created_at,
    display_name: row.name,
    icon_url: row.icon_url,
    id: row.id,
    name: row.name,
    note: row.note,
    sort_order: row.sort_order,
    website_url: row.website_url,
  };
}

function toMerchantAliasData(row: MerchantAliasRow): MerchantAliasData {
  return {
    alias: row.alias,
    created_at: row.created_at,
    id: row.id,
    is_preferred: row.is_preferred,
    merchant_id: row.merchant_id,
    sort_order: row.sort_order,
  };
}

function toMerchantSummary(row: MerchantSummaryRow): MerchantSummary {
  return {
    icon_url: row.icon_url,
    id: row.id,
    name: row.name,
  };
}

function attachMerchantAliases(
  merchants: MerchantData[],
  aliases: MerchantAliasData[],
): MerchantData[] {
  const aliasesByMerchantId = new Map<string, MerchantAliasData[]>();

  for (const alias of aliases) {
    const currentAliases = aliasesByMerchantId.get(alias.merchant_id) ?? [];
    currentAliases.push(alias);
    aliasesByMerchantId.set(alias.merchant_id, currentAliases);
  }

  return merchants.map((merchant) => ({
    ...merchant,
    aliases: aliasesByMerchantId.get(merchant.id) ?? [],
    display_name:
      aliasesByMerchantId.get(merchant.id)?.find((alias) => alias.is_preferred)
        ?.alias ?? merchant.name,
  }));
}

function applyPreferredNames(
  merchants: MerchantSummary[],
  aliases: Array<{ alias: string; merchant_id: string }>,
): MerchantSummary[] {
  const preferredNameByMerchantId = new Map(
    aliases.map((alias) => [alias.merchant_id, alias.alias]),
  );

  return merchants.map((merchant) => ({
    ...merchant,
    name: preferredNameByMerchantId.get(merchant.id) ?? merchant.name,
  }));
}

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

  async function loadPreferredAliases(merchantIds: string[]) {
    if (merchantIds.length === 0) return [];

    const { data, error } = await supabase
      .from("merchant_alias")
      .select("merchant_id, alias")
      .in("merchant_id", merchantIds)
      .eq("is_archived", false)
      .eq("is_preferred", true);

    if (error) {
      fail(
        "[merchant] failed to load preferred merchant aliases",
        merchantErrorCodes.merchantAliasListFailed,
        "商家别名读取失败，请稍后重试。",
        { merchantCount: merchantIds.length },
        error,
      );
    }
    return (data ?? []) as Array<{ alias: string; merchant_id: string }>;
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
            is_preferred: false,
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

    async findActiveMerchantData(ledgerId, merchantId) {
      const { data: merchantData, error: merchantError } = await supabase
        .from("merchant")
        .select(merchantColumns)
        .eq("id", merchantId)
        .eq("ledger_id", ledgerId)
        .eq("is_archived", false)
        .maybeSingle();

      if (merchantError) {
        fail(
          "[merchant] failed to load merchant details",
          merchantErrorCodes.merchantReadFailed,
          "商家信息读取失败，请稍后重试。",
          { ledgerId, merchantId },
          merchantError,
        );
      }
      if (!merchantData) return null;

      const { data: aliasData, error: aliasError } = await supabase
        .from("merchant_alias")
        .select("id, merchant_id, alias, is_preferred, sort_order, created_at")
        .eq("merchant_id", merchantId)
        .eq("is_archived", false)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });

      if (aliasError) {
        fail(
          "[merchant] failed to load merchant detail aliases",
          merchantErrorCodes.merchantAliasListFailed,
          "商家别名读取失败，请稍后重试。",
          { ledgerId, merchantId },
          aliasError,
        );
      }

      return attachMerchantAliases(
        [toMerchantData(merchantData as MerchantRow)],
        ((aliasData ?? []) as MerchantAliasRow[]).map(toMerchantAliasData),
      )[0]!;
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
      const merchants = ((data ?? []) as MerchantSummaryRow[]).map(
        toMerchantSummary,
      );
      return applyPreferredNames(
        merchants,
        await loadPreferredAliases(merchants.map((merchant) => merchant.id)),
      );
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

      const merchants = ((merchantData ?? []) as MerchantRow[]).map(
        toMerchantData,
      );
      const merchantIds = merchants.map((merchant) => merchant.id);
      if (merchantIds.length === 0) return merchants;

      const { data: aliasData, error: aliasError } = await supabase
        .from("merchant_alias")
        .select("id, merchant_id, alias, is_preferred, sort_order, created_at")
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

      return attachMerchantAliases(
        merchants,
        ((aliasData ?? []) as MerchantAliasRow[]).map(toMerchantAliasData),
      );
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
      const merchants = ((data ?? []) as MerchantSummaryRow[]).map(
        toMerchantSummary,
      );
      return applyPreferredNames(
        merchants,
        await loadPreferredAliases(merchants.map((merchant) => merchant.id)),
      );
    },

    async setPreferredAlias(input) {
      const { data, error } = await supabase.rpc(
        "set_merchant_preferred_alias",
        {
          p_alias_id: input.aliasId,
          p_ledger_id: input.ledgerId,
          p_merchant_id: input.merchantId,
        },
      );

      if (error) {
        fail(
          "[merchant] failed to update preferred alias",
          merchantErrorCodes.aliasPreferredUpdateFailed,
          "展示名更新失败，请稍后重试。",
          {
            aliasId: input.aliasId,
            ledgerId: input.ledgerId,
            merchantId: input.merchantId,
          },
          error,
          merchantErrorCodes.aliasPreferredUpdateFailed,
        );
      }
      return data === true;
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
