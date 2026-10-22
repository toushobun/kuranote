import type {
  LedgerSetupAccountType,
  LedgerSetupTemplate,
} from "internal/ledger/entity/ledgerSetupTemplate/ledgerSetupTemplate";
import type { LedgerSetupDraft } from "internal/ledger/schema/ledgerSetupDraft";
import { buildMerchantFaviconUrl } from "utils/merchants";

/** complete_ledger_setup 的 payload。字段名与 RPC 中的 jsonb 结构一致。 */
export type LedgerSetupCompletionPayload = {
  accounts: { name: string; type: LedgerSetupAccountType }[];
  merchantTags: { icon: string; key: string; name: string }[];
  merchants: {
    aliases: { alias: string; locale: string }[];
    iconUrl: string | null;
    name: string;
    tagKeys: string[];
    websiteUrl: string | null;
  }[];
  multiAccountPaymentEnabled: boolean;
  specialStatusEnabled: boolean;
};

/**
 * 根据已按当前模板校正的草稿与代码模板生成完成写入 payload。
 * 模板内容（商家名、URL、别名、标签）只取自代码模板，不信任客户端。
 * 商家头像按手动新增商家相同的 favicon 规则直接由官网生成，不在完成写入时逐个抓取。
 * 跳过的步骤不写入任何数据；商家标签只创建被选中商家所属的标签，
 * 商家关联其在模板中的全部标签（多标签商家只创建一次）。
 */
export function buildLedgerSetupCompletionPayload(
  draft: LedgerSetupDraft,
  template: LedgerSetupTemplate | null,
): LedgerSetupCompletionPayload {
  const accounts = draft.accounts.skipped
    ? []
    : draft.accounts.items.map(({ name, type }) => ({
        name: name.trim(),
        type,
      }));

  return {
    accounts,
    ...buildLedgerSetupMerchantPayload(
      draft.merchants.skipped ? [] : draft.merchants.selectedKeys,
      template,
    ),
    multiAccountPaymentEnabled: draft.features.multiAccountPaymentEnabled,
    specialStatusEnabled: draft.features.specialStatusEnabled,
  };
}

/** 向导与商家预设添加共用服务端模板 payload，不接收客户端商家资料。 */
export function buildLedgerSetupMerchantPayload(
  keys: readonly string[],
  template: LedgerSetupTemplate | null,
): Pick<LedgerSetupCompletionPayload, "merchantTags" | "merchants"> {
  const selectedKeys = new Set(keys);
  const merchants = (template?.merchants ?? []).filter(({ key }) =>
    selectedKeys.has(key),
  );
  const usedTagKeys = new Set(merchants.flatMap(({ tagKeys }) => tagKeys));
  const merchantTags = [...(template?.merchantTags ?? [])]
    .filter(({ key }) => usedTagKeys.has(key))
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(({ icon, key, name }) => ({ icon, key, name }));

  return {
    merchantTags,
    merchants: merchants.map(({ aliases, name, tagKeys, websiteUrl }) => ({
      aliases: aliases.map(({ alias, locale }) => ({ alias, locale })),
      iconUrl: buildMerchantFaviconUrl(websiteUrl),
      name,
      tagKeys: [...tagKeys],
      websiteUrl,
    })),
  };
}
