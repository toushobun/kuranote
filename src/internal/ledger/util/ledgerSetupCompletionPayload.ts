import type {
  LedgerSetupAccountType,
  LedgerSetupTemplate,
} from "internal/ledger/entity/ledgerSetupTemplate/ledgerSetupTemplate";
import type { LedgerSetupDraft } from "internal/ledger/schema/ledgerSetupDraft";

/** complete_ledger_setup 的 payload。字段名与 RPC 中的 jsonb 结构一致。 */
export type LedgerSetupCompletionPayload = {
  accounts: { name: string; type: LedgerSetupAccountType }[];
  merchantTags: { icon: string; key: string; name: string }[];
  merchants: {
    aliases: { alias: string; locale: string }[];
    name: string;
    tagKeys: string[];
    websiteUrl: string | null;
  }[];
  specialStatusEnabled: boolean;
};

/**
 * 根据已按当前模板校正的草稿与代码模板生成完成写入 payload。
 * 模板内容（商家名、URL、别名、标签）只取自代码模板，不信任客户端。
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

  const selectedKeys = new Set(
    draft.merchants.skipped ? [] : draft.merchants.selectedKeys,
  );
  const merchants = (template?.merchants ?? []).filter(({ key }) =>
    selectedKeys.has(key),
  );
  const usedTagKeys = new Set(merchants.flatMap(({ tagKeys }) => tagKeys));
  const merchantTags = [...(template?.merchantTags ?? [])]
    .filter(({ key }) => usedTagKeys.has(key))
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(({ icon, key, name }) => ({ icon, key, name }));

  return {
    accounts,
    merchantTags,
    merchants: merchants.map(({ aliases, name, tagKeys, websiteUrl }) => ({
      aliases: aliases.map(({ alias, locale }) => ({ alias, locale })),
      name,
      tagKeys: [...tagKeys],
      websiteUrl,
    })),
    specialStatusEnabled: draft.features.specialStatusEnabled,
  };
}
