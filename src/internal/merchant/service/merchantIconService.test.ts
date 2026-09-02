// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

import {
  createMerchantIconService,
  getReusableMerchantIconUrl,
} from "internal/merchant/service/merchantIconService";
import {
  RepositoryError,
  ValidationError,
} from "internal/shared/errors/appError";

const publicLookup = vi.fn(async () => [
  { address: "142.250.196.36", family: 4 },
]);

describe("createMerchantIconService", () => {
  it("只复用与当前网址同源的 Google 图标预览地址", () => {
    const previewUrl =
      "https://t2.gstatic.com/faviconV2?url=https://example.com&size=128";

    expect(
      getReusableMerchantIconUrl("https://example.com/products", previewUrl),
    ).toBe(previewUrl);
    expect(
      getReusableMerchantIconUrl("https://other.example", previewUrl),
    ).toBeNull();
    expect(
      getReusableMerchantIconUrl(
        "https://example.com",
        "https://evil.example/faviconV2?url=https://example.com",
      ),
    ).toBeNull();
  });

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
      url: expect.stringContaining("https://www.google.com/s2/favicons"),
    });
    const requestedUrl = String(vi.mocked(fetchImpl).mock.calls[0]?.[0]);
    expect(requestedUrl).toContain("https://www.google.com/s2/favicons");
    expect(requestedUrl).toContain("domain_url=https%3A%2F%2Fexample.com");
  });

  it("允许跳转到 Google favicon 静态资源域并返回最终地址", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(null, {
          headers: {
            location:
              "https://t2.gstatic.com/faviconV2?url=https://example.com&size=128",
          },
          status: 301,
        }),
      )
      .mockResolvedValueOnce(
        new Response(new Uint8Array([1, 2, 3]), {
          headers: { "content-type": "image/png" },
        }),
      ) as unknown as typeof fetch;
    const service = createMerchantIconService({
      fetchImpl,
      lookup: publicLookup,
    });

    await expect(service.fetchIcon("https://example.com")).resolves.toEqual({
      url: "https://t2.gstatic.com/faviconV2?url=https://example.com&size=128",
    });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it.each([
    {
      name: "空响应",
      response: new Response(null, {
        headers: { "content-type": "image/png" },
      }),
    },
    {
      name: "响应头声明资源过大",
      response: new Response(new Uint8Array([1]), {
        headers: {
          "content-length": String(256 * 1024 + 1),
          "content-type": "image/png",
        },
      }),
    },
    {
      name: "下载过程中读取失败",
      response: new Response(
        new ReadableStream({
          start(controller) {
            controller.error(new Error("stream failed"));
          },
        }),
        { headers: { "content-type": "image/png" } },
      ),
    },
  ])("拒绝$name", async ({ response }) => {
    const service = createMerchantIconService({
      fetchImpl: vi.fn(async () => response) as unknown as typeof fetch,
      lookup: publicLookup,
    });

    await expect(
      service.fetchIcon("https://example.com"),
    ).rejects.toMatchObject({ code: "merchant_icon_fetch_failed" });
  });

  it("分块响应超过上限时立即取消剩余下载", async () => {
    let canceled = false;
    let pullCount = 0;
    const chunks = Array.from({ length: 5 }, () => new Uint8Array(128 * 1024));
    const body = new ReadableStream<Uint8Array>({
      cancel() {
        canceled = true;
      },
      pull(controller) {
        const chunk = chunks.shift();
        pullCount += 1;
        if (chunk) controller.enqueue(chunk);
        else controller.close();
      },
    });
    const service = createMerchantIconService({
      fetchImpl: vi.fn(
        async () =>
          new Response(body, {
            headers: { "content-type": "image/png" },
          }),
      ) as unknown as typeof fetch,
      lookup: publicLookup,
    });

    await expect(
      service.fetchIcon("https://example.com"),
    ).rejects.toMatchObject({ code: "merchant_icon_fetch_failed" });
    expect(canceled).toBe(true);
    expect(pullCount).toBeLessThan(5);
  });

  it.each([
    "http://localhost/logo.png",
    "http://169.254.169.254/latest/meta-data",
    "http://[::1]/icon",
    "http://[::ffff:7f00:1]/icon",
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

  it.each(["::ffff:7f00:1", "0:0:0:0:0:ffff:127.0.0.1"])(
    "DNS 解析到 IPv4-mapped IPv6 私网地址时拒绝请求：%s",
    async (address) => {
      const fetchImpl = vi.fn() as unknown as typeof fetch;
      const service = createMerchantIconService({
        fetchImpl,
        lookup: async () => [{ address, family: 6 }],
      });

      await expect(
        service.fetchIcon("https://example.com"),
      ).rejects.toBeInstanceOf(ValidationError);
      expect(fetchImpl).not.toHaveBeenCalled();
    },
  );

  it.each(["::7f00:1", "::a9fe:a9fe"])(
    "DNS 解析到 IPv4-compatible IPv6 私网地址时拒绝请求：%s",
    async (address) => {
      const fetchImpl = vi.fn() as unknown as typeof fetch;
      const service = createMerchantIconService({
        fetchImpl,
        lookup: async () => [{ address, family: 6 }],
      });

      await expect(
        service.fetchIcon("https://example.com"),
      ).rejects.toBeInstanceOf(ValidationError);
      expect(fetchImpl).not.toHaveBeenCalled();
    },
  );

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

  it("外部图标请求超时时停止等待并返回安全错误", async () => {
    const fetchImpl = vi.fn(
      async (_input: RequestInfo | URL, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          const signal = init?.signal;
          signal?.addEventListener("abort", () => reject(signal.reason), {
            once: true,
          });
        }),
    ) as unknown as typeof fetch;
    const service = createMerchantIconService({
      fetchImpl,
      lookup: publicLookup,
      timeoutMs: 5,
    });

    await expect(
      service.fetchIcon("https://example.com"),
    ).rejects.toMatchObject({
      code: "merchant_icon_fetch_failed",
      message: "未能获取网站图标，请确认网址后重试。",
    });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
});
