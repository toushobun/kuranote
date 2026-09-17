import { defaultMerchantTagEmoji } from "config/merchantTagEmojis";
import type { MerchantService } from "internal/merchant/service/merchantService";
import { RepositoryError } from "internal/shared/errors/appError";

export type MerchantImportEntry = {
  id: string;
  matchNames: string[];
  tagIds: string[];
};

export type MerchantImportTag = {
  id: string;
  name: string;
};

export type MerchantImportContext = {
  merchants: MerchantImportEntry[];
  tags: MerchantImportTag[];
};

export interface MerchantImportService {
  addTag(input: {
    ledgerId: string;
    merchantId: string;
    tagId: string;
  }): Promise<void>;
  createMerchant(input: {
    ledgerId: string;
    name: string;
    tagIds: string[];
  }): Promise<{ merchantId: string }>;
  createTag(input: {
    ledgerId: string;
    name: string;
  }): Promise<{ tagId: string }>;
  loadContext(input: { ledgerId: string }): Promise<MerchantImportContext>;
}

function toImportEntry(
  merchant: Awaited<ReturnType<MerchantService["getMerchant"]>>,
): MerchantImportEntry {
  return {
    id: merchant.id,
    matchNames: [
      merchant.name,
      merchant.display_name,
      ...merchant.aliases.map((alias) => alias.alias),
    ].filter((name, index, names) => names.indexOf(name) === index),
    tagIds: merchant.tags.map((tag) => tag.id),
  };
}

/** 数据导入模块只依赖这一层窄接口，不直接接触 Merchant Repository。 */
export function createMerchantImportService(
  service: MerchantService,
): MerchantImportService {
  async function loadContext({
    ledgerId,
  }: {
    ledgerId: string;
  }): Promise<MerchantImportContext> {
    const { merchants, tags } = await service.list({ keyword: "", ledgerId });
    return {
      merchants: merchants.map(toImportEntry),
      tags: tags.map((tag) => ({ id: tag.id, name: tag.name })),
    };
  }

  return {
    async addTag({ ledgerId, merchantId, tagId }) {
      const merchant = await service.getMerchant({ ledgerId, merchantId });
      if (merchant.tags.some((tag) => tag.id === tagId)) return;

      await service.updateMerchant({
        ledgerId,
        merchantId,
        name: merchant.name,
        note: merchant.note,
        previewIconUrl: null,
        siteUrl: merchant.website_url,
        tagIds: [...merchant.tags.map((tag) => tag.id), tagId],
      });
    },

    async createMerchant({ ledgerId, name, tagIds }) {
      await service.createMerchant({
        ledgerId,
        name,
        note: null,
        previewIconUrl: null,
        siteUrl: null,
        tagIds,
      });

      const { merchants } = await loadContext({ ledgerId });
      const created = merchants.find((merchant) =>
        merchant.matchNames.includes(name),
      );
      if (!created) {
        throw new RepositoryError(
          "merchant_create_failed",
          "商家新增失败，请稍后重试。",
        );
      }
      return { merchantId: created.id };
    },

    async createTag({ ledgerId, name }) {
      await service.createTag({
        icon: defaultMerchantTagEmoji,
        ledgerId,
        name,
      });
      const created = (await service.listTags({ ledgerId })).find(
        (tag) => tag.name === name,
      );
      if (!created) {
        throw new RepositoryError(
          "merchant_tag_create_failed",
          "商家标签新增失败，请稍后重试。",
        );
      }
      return { tagId: created.id };
    },

    loadContext,
  };
}
