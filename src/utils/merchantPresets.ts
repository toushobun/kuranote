import type { LedgerSetupTemplate } from "internal/ledger";
import { getWebsiteDisplayDomain, normalizeSearchText } from "utils/merchants";

/** 向导与商家管理共用模板到勾选列表的转换，不复制模板数据。 */
export function buildMerchantChecklist(template: LedgerSetupTemplate) {
  return {
    groups: [...template.merchantTags]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((tag) => ({
        icon: tag.icon,
        itemKeys: template.merchants
          .filter(({ tagKeys }) => tagKeys.includes(tag.key))
          .map(({ key }) => key),
        key: tag.key,
        name: tag.name,
      })),
    items: template.merchants.map(({ key, name, websiteUrl }) => ({
      key,
      name,
      secondaryText: getWebsiteDisplayDomain(websiteUrl) ?? undefined,
    })),
  };
}

/** 名称与别名的匹配入口；导入与预设添加共用忽略大小写的名称集合。 */
export function getMerchantMatchNames(merchant: {
  name: string;
  display_name: string;
  aliases: readonly { alias: string }[];
}) {
  return [
    ...new Set([
      merchant.name,
      merchant.display_name,
      ...merchant.aliases.map(({ alias }) => alias),
    ]),
  ];
}

export function getAddedMerchantPresetKeys(
  template: LedgerSetupTemplate,
  existingNames: readonly string[],
) {
  const names = new Set(existingNames.map(normalizeSearchText));
  return template.merchants
    .filter(({ name, aliases }) =>
      [name, ...aliases.map(({ alias }) => alias)].some((value) =>
        names.has(normalizeSearchText(value)),
      ),
    )
    .map(({ key }) => key);
}
