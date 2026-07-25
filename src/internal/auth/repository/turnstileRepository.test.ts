// @vitest-environment node

import { afterEach, describe, expect, it, vi } from "vitest";

import { createCloudflareTurnstileRepository } from "internal/auth/repository/turnstileRepository";
import type { Logger } from "internal/shared/logging/logger";

function createLogger(): Logger {
  return { error: vi.fn(), info: vi.fn(), warn: vi.fn() };
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("createCloudflareTurnstileRepository", () => {
  it("携带 token、secret 和可信 IP 调用 Cloudflare", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("TURNSTILE_SECRET_KEY", "secret-key");
    const fetcher = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({ success: true }),
      ok: true,
    });
    const repository = createCloudflareTurnstileRepository(
      createLogger(),
      fetcher,
    );

    await expect(
      repository.verify({ remoteIp: "203.0.113.10", token: "token-value" }),
    ).resolves.toBe(true);

    const [, init] = fetcher.mock.calls[0] as [string, RequestInit];
    expect(fetcher).toHaveBeenCalledWith(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      expect.objectContaining({ method: "POST" }),
    );
    expect(String(init.body)).toContain("response=token-value");
    expect(String(init.body)).toContain("secret=secret-key");
    expect(String(init.body)).toContain("remoteip=203.0.113.10");
  });

  it("非 Production 缺少 secret 时直接失败且不发外部请求", async () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("VERCEL_ENV", "development");
    vi.stubEnv("TURNSTILE_SECRET_KEY", "");
    const fetcher = vi.fn();
    const repository = createCloudflareTurnstileRepository(
      createLogger(),
      fetcher,
    );

    await expect(
      repository.verify({ remoteIp: null, token: "token-value" }),
    ).resolves.toBe(false);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("缺少 token 时直接失败且不发外部请求", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("TURNSTILE_SECRET_KEY", "secret-key");
    const fetcher = vi.fn();
    const repository = createCloudflareTurnstileRepository(
      createLogger(),
      fetcher,
    );

    await expect(
      repository.verify({ remoteIp: null, token: "" }),
    ).resolves.toBe(false);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("Production 缺少 secret 时抛出可识别配置错误且不发外部请求", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("TURNSTILE_SECRET_KEY", "");
    const fetcher = vi.fn();
    const repository = createCloudflareTurnstileRepository(
      createLogger(),
      fetcher,
    );

    await expect(
      repository.verify({ remoteIp: null, token: "token-value" }),
    ).rejects.toMatchObject({
      message: "TURNSTILE_SECRET_KEY is required in production.",
      name: "TurnstileConfigurationError",
    });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("网络异常时记录安全日志并转换为 RepositoryError", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("TURNSTILE_SECRET_KEY", "secret-key");
    const logger = createLogger();
    const fetcher = vi.fn().mockRejectedValue(new Error("network details"));
    const repository = createCloudflareTurnstileRepository(logger, fetcher);

    await expect(
      repository.verify({ remoteIp: null, token: "token-value" }),
    ).rejects.toMatchObject({
      code: "turnstile_service_unavailable",
      message: "安全验证服务暂时不可用，请稍后重试。",
    });
    expect(logger.warn).toHaveBeenCalledWith(
      "[auth] Turnstile verification request failed",
      { errorName: "Error" },
    );
    expect(JSON.stringify(vi.mocked(logger.warn).mock.calls)).not.toContain(
      "network details",
    );
  });

  it("Cloudflare 非成功响应转换为 RepositoryError", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("TURNSTILE_SECRET_KEY", "secret-key");
    const repository = createCloudflareTurnstileRepository(
      createLogger(),
      vi.fn().mockResolvedValue({ ok: false }),
    );

    await expect(
      repository.verify({ remoteIp: null, token: "token-value" }),
    ).rejects.toMatchObject({
      code: "turnstile_service_unavailable",
      message: "安全验证服务暂时不可用，请稍后重试。",
    });
  });
});
