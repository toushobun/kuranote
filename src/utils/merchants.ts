import type { Merchant } from "types/merchants";

export function getMerchantInitial(name: string | null, fallback = "?") {
  const trimmedName = name?.trim() ?? "";

  if (trimmedName.length === 0) {
    return fallback;
  }

  return Array.from(trimmedName)[0]?.toUpperCase() ?? fallback;
}

export function normalizeSearchText(value: string) {
  return value.trim().toLowerCase();
}

export function resolveMerchantDisplayName(
  formalName: string,
  preferredAlias: string | null | undefined,
) {
  return preferredAlias ?? formalName;
}

export function filterMerchantsByKeyword(
  merchants: Merchant[],
  keyword: string,
) {
  const normalizedKeyword = normalizeSearchText(keyword);

  if (normalizedKeyword.length === 0) {
    return merchants;
  }

  return merchants.filter((merchant) => {
    const matchedByName = normalizeSearchText(merchant.name).includes(
      normalizedKeyword,
    );
    const matchedByAlias = merchant.aliases.some((alias) =>
      normalizeSearchText(alias.alias).includes(normalizedKeyword),
    );

    return matchedByName || matchedByAlias;
  });
}

/**
 * 从官网 URL 取得用于显示的域名：去掉协议、「www.」与路径。
 * 例：`https://www.skylark.co.jp/gusto/` → `skylark.co.jp`。无法解析时返回 null。
 */
export function getWebsiteDisplayDomain(websiteUrl: string | null) {
  if (!websiteUrl) return null;

  try {
    return new URL(websiteUrl).hostname.replace(/^www\./, "") || null;
  } catch {
    return null;
  }
}
