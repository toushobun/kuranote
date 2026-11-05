import type { LedgerSetupTemplate } from "internal/ledger";
import { buildMerchantFaviconUrl, normalizeSearchText } from "utils/merchants";

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
    items: template.merchants.map(
      ({ key, name, websiteUrl, aliases, regions }) => ({
        key,
        name,
        secondaryText:
          aliases.map(({ alias }) => alias).join(" · ") || undefined,
        iconUrl: buildMerchantFaviconUrl(websiteUrl),
        regions,
      }),
    ),
  };
}

export function getAddedMerchantPresetKeys(
  template: LedgerSetupTemplate,
  existingNames: readonly string[],
  existingDisplayNames: readonly string[] = [],
) {
  const names = new Set(existingNames.map(normalizeSearchText));
  const displayNames = new Set(existingDisplayNames.map(normalizeSearchText));
  const matchNames = getMerchantPresetMatchNames(template);
  return template.merchants
    .filter(
      ({ key, name }) =>
        displayNames.has(normalizeSearchText(name)) ||
        (matchNames.get(key) ?? []).some((value) =>
          names.has(normalizeSearchText(value)),
        ),
    )
    .map(({ key }) => key);
}

/** 歧义别名继续用于搜索；判重只使用整个目录中唯一指向一家商家的名称。 */
export function getMerchantPresetMatchNames(template: LedgerSetupTemplate) {
  const owners = new Map<string, Set<string>>();
  for (const { key, name, aliases } of template.merchants) {
    for (const value of [name, ...aliases.map((a) => a.alias)]) {
      const normalized = normalizeSearchText(value);
      const keys = owners.get(normalized) ?? new Set<string>();
      keys.add(key);
      owners.set(normalized, keys);
    }
  }
  return new Map(
    template.merchants.map(({ key, name, aliases }) => [
      key,
      [name, ...aliases.map((a) => a.alias)].filter(
        (value) => owners.get(normalizeSearchText(value))?.size === 1,
      ),
    ]),
  );
}
