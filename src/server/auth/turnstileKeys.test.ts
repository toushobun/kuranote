import { afterEach, describe, expect, it, vi } from "vitest";

import { turnstileTestSecretKey, turnstileTestSiteKey } from "config/turnstile";

import {
  getTurnstileSecretKey,
  getTurnstileSiteKey,
  TurnstileConfigurationError,
} from "./turnstileKeys";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("turnstileKeys", () => {
  it("Production 使用正式 site key", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "prod-site-key");

    expect(getTurnstileSiteKey()).toBe("prod-site-key");
  });

  it("Production 缺少正式 site key 时抛出错误", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "");

    expect(() => getTurnstileSiteKey()).toThrow(
      "NEXT_PUBLIC_TURNSTILE_SITE_KEY is required in production.",
    );
  });

  it("Vercel Preview 同时配置专用 site key 和 secret key 时使用专用 key pair", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "prod-site-key");
    vi.stubEnv("TURNSTILE_SECRET_KEY", "prod-secret-key");
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_PREVIEW_SITE_KEY", "preview-site-key");
    vi.stubEnv("TURNSTILE_PREVIEW_SECRET_KEY", "preview-secret-key");

    expect(getTurnstileSiteKey()).toBe("preview-site-key");
    expect(getTurnstileSecretKey()).toBe("preview-secret-key");
  });

  it("Vercel Preview 缺少专用 key pair 时使用官方测试 key pair", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "prod-site-key");
    vi.stubEnv("TURNSTILE_SECRET_KEY", "prod-secret-key");
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_PREVIEW_SITE_KEY", "");
    vi.stubEnv("TURNSTILE_PREVIEW_SECRET_KEY", "");

    expect(getTurnstileSiteKey()).toBe(turnstileTestSiteKey);
    expect(getTurnstileSecretKey()).toBe(turnstileTestSecretKey);
  });

  it("Vercel Preview 只配置专用 site key 时使用官方测试 key pair", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "prod-site-key");
    vi.stubEnv("TURNSTILE_SECRET_KEY", "prod-secret-key");
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_PREVIEW_SITE_KEY", "preview-site-key");
    vi.stubEnv("TURNSTILE_PREVIEW_SECRET_KEY", "");

    expect(getTurnstileSiteKey()).toBe(turnstileTestSiteKey);
    expect(getTurnstileSecretKey()).toBe(turnstileTestSecretKey);
  });

  it("Vercel Preview 只配置专用 secret key 时使用官方测试 key pair", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "prod-site-key");
    vi.stubEnv("TURNSTILE_SECRET_KEY", "prod-secret-key");
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_PREVIEW_SITE_KEY", "");
    vi.stubEnv("TURNSTILE_PREVIEW_SECRET_KEY", "preview-secret-key");

    expect(getTurnstileSiteKey()).toBe(turnstileTestSiteKey);
    expect(getTurnstileSecretKey()).toBe(turnstileTestSecretKey);
  });

  it("本地开发缺少正式 site key 时使用官方测试 site key", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "");

    expect(getTurnstileSiteKey()).toBe(turnstileTestSiteKey);
  });

  it("Production 使用正式 secret key", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("TURNSTILE_SECRET_KEY", "prod-secret-key");

    expect(getTurnstileSecretKey()).toBe("prod-secret-key");
  });

  it("Production 缺少正式 secret key 时抛出可识别配置错误", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("TURNSTILE_SECRET_KEY", "");

    expect(() => getTurnstileSecretKey()).toThrow(
      TurnstileConfigurationError,
    );
    expect(() => getTurnstileSecretKey()).toThrow(
      "TURNSTILE_SECRET_KEY is required in production.",
    );
  });

  it("本地开发缺少正式 secret key 时保持 fail closed", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("VERCEL_ENV", "development");
    vi.stubEnv("TURNSTILE_SECRET_KEY", "");

    expect(getTurnstileSecretKey()).toBe("");
  });
});
