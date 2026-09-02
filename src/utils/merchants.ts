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

export function parseWebsiteUrl(value: unknown): string | null | undefined {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== "string") {
    return undefined;
  }

  const trimmedValue = value.trim();
  if (trimmedValue.length === 0) {
    return null;
  }

  try {
    const url = new URL(trimmedValue);

    if (!["http:", "https:"].includes(url.protocol) || !url.hostname) {
      return undefined;
    }

    return trimmedValue;
  } catch {
    return undefined;
  }
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
