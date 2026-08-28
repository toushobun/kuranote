// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

import { createMerchantIconService } from "internal/merchant/service/merchantIconService";
import {
  RepositoryError,
  ValidationError,
} from "internal/shared/errors/appError";

const publicLookup = vi.fn(async () => [
  { address: "142.250.196.36", family: 4 },
]);

describe("createMerchantIconService", () => {
  it("只向固定 favicon 提供方请求公开网站的图标", async () => {
    const fetchImpl = vi.fn(
      async () =>
        new Response(new Uint8Array([1, 2, 3]), {
          headers: { "content-type": "image/png" },
        }),
    ) as unknown as typeof fetch;
    const service = createMerchantIconService({
      fetchImpl,
      lookup: publicLookup,
    });

    await expect(
      service.fetchIcon("https://example.com/path"),
    ).resolves.toMatchObject({
      contentType: "image/png",
    });
    const requestedUrl = String(vi.mocked(fetchImpl).mock.calls[0]?.[0]);
    expect(requestedUrl).toContain("https://www.google.com/s2/favicons");
    expect(requestedUrl).toContain("domain_url=https%3A%2F%2Fexample.com");
  });

  it.each([
    "http://localhost/logo.png",
    "http://169.254.169.254/latest/meta-data",
    "http://[::1]/icon",
    "https://user:password@example.com",
  ])("拒绝本机、metadata、内网或含凭据的网址：%s", async (websiteUrl) => {
    const fetchImpl = vi.fn() as unknown as typeof fetch;
    const service = createMerchantIconService({
      fetchImpl,
      lookup: publicLookup,
    });

    await expect(service.fetchIcon(websiteUrl)).rejects.toBeInstanceOf(
      ValidationError,
    );
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("DNS 解析到私网地址时拒绝请求", async () => {
    const fetchImpl = vi.fn() as unknown as typeof fetch;
    const service = createMerchantIconService({
      fetchImpl,
      lookup: async () => [{ address: "10.0.0.8", family: 4 }],
    });

    await expect(
      service.fetchIcon("https://example.com"),
    ).rejects.toBeInstanceOf(ValidationError);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("拒绝跳转到非白名单主机且不继续请求", async () => {
    const fetchImpl = vi.fn(
      async () =>
        new Response(null, {
          headers: { location: "https://evil.example/icon.png" },
          status: 302,
        }),
    ) as unknown as typeof fetch;
    const service = createMerchantIconService({
      fetchImpl,
      lookup: publicLookup,
    });

    await expect(
      service.fetchIcon("https://example.com"),
    ).rejects.toBeInstanceOf(RepositoryError);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
});
