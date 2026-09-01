import type { MerchantSummary } from "internal/merchant/entity/merchantSummary";
import {
  getMerchantErrorMessage,
  merchantErrorCodes,
  type MerchantErrorCode,
} from "internal/merchant/errors";
import {
  ConflictError,
  ValidationError,
} from "internal/shared/errors/appError";
import type { Logger } from "internal/shared/logging/logger";
import type { AuthenticatedSupabaseClient } from "internal/shared/supabase/authenticatedClient";
import { toRepositoryError } from "internal/shared/supabase/repositoryError";
import { resolveMerchantDisplayName } from "utils/merchants";

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

type MerchantTagRow = {
  icon: string;
  id: string;
  name: string;
  sort_order: number;
};

type MerchantTagLinkRow = { merchant_id: string; tag_id: string };

type RpcBusinessError = {
  code: MerchantErrorCode;
  message: string;
  type: "conflict" | "validation";
};

const merchantTagWriteBusinessErrors: Record<string, RpcBusinessError> = {
  merchant_tags_invalid: {
    code: merchantErrorCodes.merchantTagInvalid,
    message: getMerchantErrorMessage(merchantErrorCodes.merchantTagInvalid),
    type: "conflict",
  },
};

const merchantTagReorderBusinessErrors: Record<string, RpcBusinessError> = {
  ledger_not_found: {
    code: merchantErrorCodes.ledgerInvalid,
    message: getMerchantErrorMessage(merchantErrorCodes.ledgerInvalid),
    type: "conflict",
  },
  merchant_tag_order_invalid: {
    code: merchantErrorCodes.merchantTagOrderInvalid,
    message: getMerchantErrorMessage(
      merchantErrorCodes.merchantTagOrderInvalid,
    ),
    type: "validation",
  },
  merchant_tag_set_invalid: {
    code: merchantErrorCodes.merchantTagSetInvalid,
    message: getMerchantErrorMessage(merchantErrorCodes.merchantTagSetInvalid),
    type: "conflict",
  },
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
  tags: MerchantTagData[];
  website_url: string | null;
};

export type MerchantTagData = {
  icon: string;
  id: string;
  merchant_count: number;
  name: string;
  sort_order: number;
};

export type ActiveMerchantListData = {
  merchants: MerchantData[];
  tags: MerchantTagData[];
};

export type CreateMerchantInput = {
  ledgerId: string;
  name: string;
  note: string | null;
  siteUrl: string | null;
  tagIds?: string[];
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
export type CreateMerchantTagInput = {
  icon: string;
  ledgerId: string;
  name: string;
};
export type UpdateMerchantTagInput = Omit<
  CreateMerchantTagInput,
  "sortOrder" | "userId"
> & { tagId: string };

export interface MerchantRepository {
  archiveAlias(input: ArchiveMerchantAliasInput): Promise<boolean>;
  archiveMerchant(input: ArchiveMerchantInput): Promise<boolean>;
  archiveTag(ledgerId: string, tagId: string): Promise<boolean>;
  createAlias(input: CreateMerchantAliasInput): Promise<void>;
  createMerchant(input: CreateMerchantInput): Promise<void>;
  createTag(input: CreateMerchantTagInput): Promise<void>;
  findActiveAlias(aliasId: string): Promise<{ merchantId: string } | null>;
  findActiveMerchant(ledgerId: string, merchantId: string): Promise<boolean>;
  findActiveMerchantData(
    ledgerId: string,
    merchantId: string,
  ): Promise<MerchantData | null>;
  findActiveTag(
    ledgerId: string,
    tagId: string,
  ): Promise<MerchantTagData | null>;
  findSummariesByIds(
    ledgerId: string,
    merchantIds: string[],
  ): Promise<MerchantSummary[]>;
  listActive(ledgerId: string): Promise<ActiveMerchantListData>;
  listActiveSummaries(ledgerId: string): Promise<MerchantSummary[]>;
  listActiveTagIds(ledgerId: string): Promise<string[]>;
  listActiveTags(ledgerId: string): Promise<MerchantTagData[]>;
  reorderTags(ledgerId: string, tagIds: string[]): Promise<void>;
  setPreferredAlias(input: SetPreferredMerchantAliasInput): Promise<boolean>;
  updateMerchant(input: UpdateMerchantInput): Promise<boolean>;
  updateTag(input: UpdateMerchantTagInput): Promise<boolean>;
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
    tags: [],
    website_url: row.website_url,
  };
}

function toMerchantTagData(row: MerchantTagRow): MerchantTagData {
  return { ...row, merchant_count: 0 };
}

function attachMerchantCounts(
  tags: MerchantTagData[],
  links: MerchantTagLinkRow[],
): MerchantTagData[] {
  const counts = new Map<string, number>();
  for (const link of links) {
    counts.set(link.tag_id, (counts.get(link.tag_id) ?? 0) + 1);
  }
  return tags.map((tag) => ({
    ...tag,
    merchant_count: counts.get(tag.id) ?? 0,
  }));
}

function attachMerchantTags(
  merchants: MerchantData[],
  tags: MerchantTagData[],
  links: MerchantTagLinkRow[],
): MerchantData[] {
  const tagById = new Map(tags.map((tag) => [tag.id, tag]));
  const tagsByMerchantId = new Map<string, MerchantTagData[]>();
  for (const link of links) {
    const tag = tagById.get(link.tag_id);
    if (!tag) continue;
    const current = tagsByMerchantId.get(link.merchant_id) ?? [];
    current.push(tag);
    tagsByMerchantId.set(link.merchant_id, current);
  }
  return merchants.map((merchant) => ({
    ...merchant,
    tags: tagsByMerchantId.get(merchant.id) ?? [],
  }));
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

  return merchants.map((merchant) => {
    const merchantAliases = aliasesByMerchantId.get(merchant.id) ?? [];
    const preferredAlias = merchantAliases.find(
      (alias) => alias.is_preferred,
    )?.alias;

    return {
      ...merchant,
      aliases: merchantAliases,
      display_name: resolveMerchantDisplayName(merchant.name, preferredAlias),
    };
  });
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
    name: resolveMerchantDisplayName(
      merchant.name,
      preferredNameByMerchantId.get(merchant.id),
    ),
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
    error: {
      code?: string | null;
      details?: string | null;
      message?: string | null;
    },
    conflictCode?: string,
    businessErrors: Record<string, RpcBusinessError> = {},
  ): never {
    logger.error(logMessage, {
      ...fields,
      databaseCode: error.code,
      databaseDetails: error.details,
      databaseMessage: error.message,
    });
    const businessError =
      error.details && Object.hasOwn(businessErrors, error.details)
        ? businessErrors[error.details]
        : undefined;
    if (businessError?.type === "validation") {
      throw new ValidationError(businessError.code, businessError.message);
    }
    if (businessError) {
      throw new ConflictError(businessError.code, businessError.message);
    }
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

  async function loadActiveTags(ledgerId: string): Promise<MerchantTagData[]> {
    const { data, error } = await supabase
      .from("merchant_tags")
      .select("id, name, icon, sort_order")
      .eq("ledger_id", ledgerId)
      .eq("is_archived", false)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) {
      fail(
        "[merchant] failed to load merchant tags",
        merchantErrorCodes.merchantTagListFailed,
        getMerchantErrorMessage(merchantErrorCodes.merchantTagListFailed),
        { ledgerId },
        error,
      );
    }
    return ((data ?? []) as MerchantTagRow[]).map(toMerchantTagData);
  }

  async function loadTagLinks(merchantIds: string[]) {
    if (merchantIds.length === 0) return [];
    const { data, error } = await supabase
      .from("merchant_tag_links")
      .select("merchant_id, tag_id")
      .in("merchant_id", merchantIds);
    if (error) {
      fail(
        "[merchant] failed to load merchant tag links",
        merchantErrorCodes.merchantTagListFailed,
        getMerchantErrorMessage(merchantErrorCodes.merchantTagListFailed),
        { merchantCount: merchantIds.length },
        error,
      );
    }
    return (data ?? []) as MerchantTagLinkRow[];
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

    async archiveTag(ledgerId, tagId) {
      const { data, error } = await supabase.rpc("archive_merchant_tag", {
        p_ledger_id: ledgerId,
        p_tag_id: tagId,
      });
      if (error) {
        fail(
          "[merchant] failed to archive merchant tag",
          merchantErrorCodes.merchantTagArchiveFailed,
          getMerchantErrorMessage(merchantErrorCodes.merchantTagArchiveFailed),
          { ledgerId, tagId },
          error,
        );
      }
      return data === true;
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
      const { error } = await supabase.rpc("create_merchant_with_tags", {
        p_ledger_id: input.ledgerId,
        p_name: input.name,
        p_note: input.note,
        p_tag_ids: input.tagIds ?? [],
        p_website_url: input.siteUrl,
      });

      if (error) {
        fail(
          "[merchant] failed to create merchant",
          merchantErrorCodes.createFailed,
          "商家新增失败，请稍后重试。",
          { ledgerId: input.ledgerId },
          error,
          merchantErrorCodes.createFailed,
          merchantTagWriteBusinessErrors,
        );
      }
    },

    async createTag(input) {
      const { error } = await supabase.rpc("create_merchant_tag", {
        p_icon: input.icon,
        p_ledger_id: input.ledgerId,
        p_name: input.name,
      });
      if (error) {
        fail(
          "[merchant] failed to create merchant tag",
          merchantErrorCodes.merchantTagCreateFailed,
          getMerchantErrorMessage(merchantErrorCodes.merchantTagCreateFailed),
          { ledgerId: input.ledgerId },
          error,
          merchantErrorCodes.merchantTagCreateFailed,
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

      const [{ data: aliasData, error: aliasError }, links] = await Promise.all(
        [
          supabase
            .from("merchant_alias")
            .select(
              "id, merchant_id, alias, is_preferred, sort_order, created_at",
            )
            .eq("merchant_id", merchantId)
            .eq("is_archived", false)
            .order("sort_order", { ascending: true })
            .order("created_at", { ascending: false }),
          loadTagLinks([merchantId]),
        ],
      );

      if (aliasError) {
        fail(
          "[merchant] failed to load merchant detail aliases",
          merchantErrorCodes.merchantAliasListFailed,
          "商家别名读取失败，请稍后重试。",
          { ledgerId, merchantId },
          aliasError,
        );
      }

      const merchant = attachMerchantAliases(
        [toMerchantData(merchantData as MerchantRow)],
        ((aliasData ?? []) as MerchantAliasRow[]).map(toMerchantAliasData),
      );
      if (links.length === 0) return merchant[0]!;

      const { data: tagData, error: tagError } = await supabase
        .from("merchant_tags")
        .select("id, name, icon, sort_order")
        .eq("ledger_id", ledgerId)
        .eq("is_archived", false)
        .in(
          "id",
          links.map((link) => link.tag_id),
        )
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });
      if (tagError) {
        fail(
          "[merchant] failed to load merchant detail tags",
          merchantErrorCodes.merchantTagListFailed,
          getMerchantErrorMessage(merchantErrorCodes.merchantTagListFailed),
          { ledgerId, merchantId },
          tagError,
        );
      }
      const tags = ((tagData ?? []) as MerchantTagRow[]).map(toMerchantTagData);
      return attachMerchantTags(merchant, tags, links)[0]!;
    },

    async findActiveTag(ledgerId, tagId) {
      const { data, error } = await supabase
        .from("merchant_tags")
        .select("id, name, icon, sort_order")
        .eq("id", tagId)
        .eq("ledger_id", ledgerId)
        .eq("is_archived", false)
        .maybeSingle();
      if (error) {
        fail(
          "[merchant] failed to load merchant tag",
          merchantErrorCodes.merchantTagListFailed,
          getMerchantErrorMessage(merchantErrorCodes.merchantTagListFailed),
          { ledgerId, tagId },
          error,
        );
      }
      return data ? toMerchantTagData(data as MerchantTagRow) : null;
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
      if (merchantIds.length === 0) {
        return { merchants, tags: await loadActiveTags(ledgerId) };
      }

      const [{ data: aliasData, error: aliasError }, baseTags, tagLinks] =
        await Promise.all([
          supabase
            .from("merchant_alias")
            .select(
              "id, merchant_id, alias, is_preferred, sort_order, created_at",
            )
            .in("merchant_id", merchantIds)
            .eq("is_archived", false)
            .order("sort_order", { ascending: true })
            .order("created_at", { ascending: false }),
          loadActiveTags(ledgerId),
          loadTagLinks(merchantIds),
        ]);

      if (aliasError) {
        fail(
          "[merchant] failed to load merchant aliases",
          merchantErrorCodes.merchantAliasListFailed,
          "商家别名读取失败，请稍后重试。",
          { ledgerId, merchantCount: merchantIds.length },
          aliasError,
        );
      }

      const withAliases = attachMerchantAliases(
        merchants,
        ((aliasData ?? []) as MerchantAliasRow[]).map(toMerchantAliasData),
      );
      const tags = attachMerchantCounts(baseTags, tagLinks);
      return {
        merchants: attachMerchantTags(withAliases, tags, tagLinks),
        tags,
      };
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

    async listActiveTagIds(ledgerId) {
      const { data, error } = await supabase
        .from("merchant_tags")
        .select("id")
        .eq("ledger_id", ledgerId)
        .eq("is_archived", false);
      if (error) {
        fail(
          "[merchant] failed to load active merchant tag ids",
          merchantErrorCodes.merchantTagListFailed,
          getMerchantErrorMessage(merchantErrorCodes.merchantTagListFailed),
          { ledgerId },
          error,
        );
      }
      return ((data ?? []) as Array<{ id: string }>).map((tag) => tag.id);
    },

    async listActiveTags(ledgerId) {
      const tags = await loadActiveTags(ledgerId);
      if (tags.length === 0) return tags;

      const { data: merchantData, error: merchantError } = await supabase
        .from("merchant")
        .select("id")
        .eq("ledger_id", ledgerId)
        .eq("is_archived", false);
      if (merchantError) {
        fail(
          "[merchant] failed to load merchants for merchant tag counts",
          merchantErrorCodes.merchantListFailed,
          "商家列表读取失败，请稍后重试。",
          { ledgerId },
          merchantError,
        );
      }

      const merchantIds = ((merchantData ?? []) as Array<{ id: string }>).map(
        (merchant) => merchant.id,
      );
      return attachMerchantCounts(tags, await loadTagLinks(merchantIds));
    },

    async reorderTags(ledgerId, tagIds) {
      const { error } = await supabase.rpc("reorder_merchant_tags", {
        p_ledger_id: ledgerId,
        p_tag_ids: tagIds,
      });
      if (error) {
        fail(
          "[merchant] failed to reorder merchant tags",
          merchantErrorCodes.merchantTagReorderFailed,
          getMerchantErrorMessage(merchantErrorCodes.merchantTagReorderFailed),
          { ledgerId },
          error,
          undefined,
          merchantTagReorderBusinessErrors,
        );
      }
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
      const { data, error } = await supabase.rpc("update_merchant_with_tags", {
        p_ledger_id: input.ledgerId,
        p_merchant_id: input.merchantId,
        p_name: input.name,
        p_note: input.note,
        p_tag_ids: input.tagIds ?? [],
        p_website_url: input.siteUrl,
      });

      if (error) {
        fail(
          "[merchant] failed to update merchant",
          merchantErrorCodes.updateFailed,
          "商家更新失败，请稍后重试。",
          { ledgerId: input.ledgerId, merchantId: input.merchantId },
          error,
          merchantErrorCodes.updateFailed,
          merchantTagWriteBusinessErrors,
        );
      }
      return data === true;
    },

    async updateTag(input) {
      const { error, count } = await supabase
        .from("merchant_tags")
        .update({ icon: input.icon, name: input.name }, { count: "exact" })
        .eq("id", input.tagId)
        .eq("ledger_id", input.ledgerId)
        .eq("is_archived", false);
      if (error) {
        fail(
          "[merchant] failed to update merchant tag",
          merchantErrorCodes.merchantTagUpdateFailed,
          getMerchantErrorMessage(merchantErrorCodes.merchantTagUpdateFailed),
          { ledgerId: input.ledgerId, tagId: input.tagId },
          error,
          merchantErrorCodes.merchantTagUpdateFailed,
        );
      }
      return count === 1;
    },
  };
}
