import { isIP } from "node:net";
import { lookup as nodeLookup } from "node:dns/promises";

import {
  getMerchantErrorMessage,
  merchantErrorCodes,
} from "internal/merchant/errors";
import {
  RepositoryError,
  ValidationError,
} from "internal/shared/errors/appError";
import { parseWebsiteUrl } from "utils/merchants";

const faviconProviderOrigin = "https://www.google.com";
const faviconProviderHostname = "www.google.com";
const faviconRedirectHostnames = new Set([
  "t0.gstatic.com",
  "t1.gstatic.com",
  "t2.gstatic.com",
  "t3.gstatic.com",
]);
const iconFetchTimeoutMs = 5_000;
const maxIconBytes = 256 * 1024;
const maxRedirects = 3;

type LookupAddress = { address: string; family: number };

export type MerchantIcon = {
  url: string;
};

export function getReusableMerchantIconUrl(
  websiteUrl: string,
  candidateUrl: string | null | undefined,
): string | null {
  if (!candidateUrl) return null;

  const parsedWebsiteUrl = parseWebsiteUrl(websiteUrl);
  if (!parsedWebsiteUrl) return null;

  try {
    const websiteOrigin = new URL(parsedWebsiteUrl).origin;
    const candidate = new URL(candidateUrl);
    if (
      candidate.protocol !== "https:" ||
      candidate.port ||
      candidate.username ||
      candidate.password
    ) {
      return null;
    }

    const targetUrl =
      candidate.hostname === faviconProviderHostname &&
      candidate.pathname === "/s2/favicons"
        ? candidate.searchParams.get("domain_url")
        : faviconRedirectHostnames.has(candidate.hostname) &&
            candidate.pathname === "/faviconV2"
          ? candidate.searchParams.get("url")
          : null;
    return targetUrl && new URL(targetUrl).origin === websiteOrigin
      ? candidate.toString()
      : null;
  } catch {
    return null;
  }
}

type MerchantIconServiceDependencies = {
  fetchImpl?: typeof fetch;
  lookup?: (hostname: string) => Promise<LookupAddress[]>;
  timeoutMs?: number;
};

function isPublicIpv4(address: string): boolean {
  const octets = address.split(".").map(Number);
  if (octets.length !== 4 || octets.some((octet) => !Number.isInteger(octet))) {
    return false;
  }

  const [a, b, c] = octets as [number, number, number, number];
  if (octets.some((octet) => octet < 0 || octet > 255)) return false;

  return !(
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 0 && c === 0) ||
    (a === 192 && b === 0 && c === 2) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    (a === 198 && b === 51 && c === 100) ||
    (a === 203 && b === 0 && c === 113) ||
    a >= 224
  );
}

function embeddedIpv4FromIpv6(address: string): string | null {
  const normalized = new URL(`http://[${address}]/`).hostname.slice(1, -1);
  const groups = normalized.match(
    /^::(?:ffff:)?([\da-f]{1,4}):([\da-f]{1,4})$/,
  );
  if (!groups) return null;

  const high = Number.parseInt(groups[1]!, 16);
  const low = Number.parseInt(groups[2]!, 16);
  return `${high >> 8}.${high & 0xff}.${low >> 8}.${low & 0xff}`;
}

function isPublicIp(address: string): boolean {
  const normalized = address.toLowerCase();
  const family = isIP(normalized);
  if (family === 4) return isPublicIpv4(normalized);
  if (family !== 6) return false;

  const embeddedIpv4 = embeddedIpv4FromIpv6(normalized);
  if (embeddedIpv4) return isPublicIpv4(embeddedIpv4);

  return !(
    normalized === "::" ||
    normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    /^fe[89ab]/.test(normalized) ||
    normalized.startsWith("ff") ||
    normalized.startsWith("2001:db8:")
  );
}

function isBlockedHostname(hostname: string): boolean {
  const normalized = hostname.toLowerCase().replace(/\.$/, "");
  return (
    normalized === "localhost" ||
    normalized === "metadata.google.internal" ||
    normalized.endsWith(".localhost") ||
    normalized.endsWith(".local") ||
    normalized.endsWith(".internal") ||
    normalized.endsWith(".lan")
  );
}

export function createMerchantIconService({
  fetchImpl = fetch,
  lookup = async (hostname) =>
    nodeLookup(hostname, { all: true, verbatim: true }),
  timeoutMs = iconFetchTimeoutMs,
}: MerchantIconServiceDependencies = {}) {
  async function requirePublicHostname(hostname: string): Promise<void> {
    const normalizedHostname = hostname.replace(/^\[|\]$/g, "");
    if (isBlockedHostname(normalizedHostname)) {
      throw new ValidationError(
        merchantErrorCodes.websiteUrlInvalid,
        "商家网址不能指向本机或内部网络。",
      );
    }

    const literalFamily = isIP(normalizedHostname);
    const addresses = literalFamily
      ? [{ address: normalizedHostname, family: literalFamily }]
      : await lookup(normalizedHostname);
    if (
      addresses.length === 0 ||
      addresses.some(({ address }) => !isPublicIp(address))
    ) {
      throw new ValidationError(
        merchantErrorCodes.websiteUrlInvalid,
        "商家网址必须指向可公开访问的网站。",
      );
    }
  }

  async function fetchIcon(websiteUrl: string): Promise<MerchantIcon> {
    const parsedWebsiteUrl = parseWebsiteUrl(websiteUrl);
    if (!parsedWebsiteUrl) {
      throw new ValidationError(
        merchantErrorCodes.websiteUrlInvalid,
        "商家网址必须以 http:// 或 https:// 开头。",
      );
    }

    const website = new URL(parsedWebsiteUrl);
    if (website.username || website.password) {
      throw new ValidationError(
        merchantErrorCodes.websiteUrlInvalid,
        "商家网址不能包含登录凭据。",
      );
    }
    await requirePublicHostname(website.hostname);

    const domainUrl = `${website.protocol}//${website.hostname}`;
    let requestUrl = new URL("/s2/favicons", faviconProviderOrigin);
    requestUrl.searchParams.set("domain_url", domainUrl);
    requestUrl.searchParams.set("sz", "128");
    const signal = AbortSignal.timeout(timeoutMs);

    for (
      let redirectCount = 0;
      redirectCount <= maxRedirects;
      redirectCount += 1
    ) {
      const isAllowedProviderHostname =
        requestUrl.hostname === faviconProviderHostname ||
        faviconRedirectHostnames.has(requestUrl.hostname);
      if (requestUrl.protocol !== "https:" || !isAllowedProviderHostname) {
        throw new RepositoryError(
          merchantErrorCodes.merchantIconRedirectInvalid,
          getMerchantErrorMessage(
            merchantErrorCodes.merchantIconRedirectInvalid,
          ),
        );
      }
      await requirePublicHostname(requestUrl.hostname);

      let response: Response;
      try {
        response = await fetchImpl(requestUrl, {
          headers: { Accept: "image/*" },
          redirect: "manual",
          signal,
        });
      } catch {
        throw new RepositoryError(
          merchantErrorCodes.merchantIconFetchFailed,
          getMerchantErrorMessage(merchantErrorCodes.merchantIconFetchFailed),
        );
      }
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        if (!location || redirectCount === maxRedirects) break;
        requestUrl = new URL(location, requestUrl);
        continue;
      }

      const contentType = response.headers.get("content-type")?.split(";")[0];
      const contentLength = Number(response.headers.get("content-length") ?? 0);
      if (
        !response.ok ||
        !contentType?.startsWith("image/") ||
        contentLength > maxIconBytes
      ) {
        break;
      }

      let bytes: ArrayBuffer;
      try {
        bytes = await response.arrayBuffer();
      } catch {
        throw new RepositoryError(
          merchantErrorCodes.merchantIconFetchFailed,
          getMerchantErrorMessage(merchantErrorCodes.merchantIconFetchFailed),
        );
      }
      if (bytes.byteLength === 0 || bytes.byteLength > maxIconBytes) break;
      return { url: requestUrl.toString() };
    }

    throw new RepositoryError(
      merchantErrorCodes.merchantIconFetchFailed,
      getMerchantErrorMessage(merchantErrorCodes.merchantIconFetchFailed),
    );
  }

  return { fetchIcon };
}
