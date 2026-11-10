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

  // 与数据库的 HTTP(S) 前缀约束一致。
  if (!/^https?:\/\//.test(trimmedValue)) return undefined;

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

/**
 * 根据官网生成 Google favicon 请求地址，只取官网的 origin。
 * 账户与商家的头像抓取与创建账本向导写入的预设商家共用此规则；
 * 数据库侧 public.merchant_favicon_url 与此保持一致。无官网或官网无效时返回 null。
 */
export function buildWebsiteFaviconUrl(websiteUrl: string | null) {
  const parsedWebsiteUrl = parseWebsiteUrl(websiteUrl);
  if (!parsedWebsiteUrl) return null;

  const faviconUrl = new URL("https://www.google.com/s2/favicons");
  faviconUrl.searchParams.set("domain_url", new URL(parsedWebsiteUrl).origin);
  faviconUrl.searchParams.set("sz", "128");
  return faviconUrl.toString();
}
