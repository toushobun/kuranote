import "server-only";

import { turnstileTestSecretKey, turnstileTestSiteKey } from "config/turnstile";

const vercelPreviewEnv = "preview";

class TurnstileConfigurationError extends Error {
  constructor() {
    super("TURNSTILE_SECRET_KEY is required in production.");
    this.name = "TurnstileConfigurationError";
  }
}

function isVercelPreview() {
  return process.env.VERCEL_ENV === vercelPreviewEnv;
}

function getPreviewTurnstileKeys() {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_PREVIEW_SITE_KEY;
  const secretKey = process.env.TURNSTILE_PREVIEW_SECRET_KEY;

  if (siteKey && secretKey) {
    return { secretKey, siteKey };
  }

  return {
    secretKey: turnstileTestSecretKey,
    siteKey: turnstileTestSiteKey,
  };
}

export function getTurnstileSiteKey() {
  if (isVercelPreview()) {
    return getPreviewTurnstileKeys().siteKey;
  }

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  if (siteKey) return siteKey;
  if (process.env.NODE_ENV !== "production") return turnstileTestSiteKey;

  throw new Error("NEXT_PUBLIC_TURNSTILE_SITE_KEY is required in production.");
}

/**
 * Production 在首次执行 Turnstile 服务端校验时快速失败。
 * Preview 由专用或官方测试 key pair 处理，非 Production 保持既有空字符串行为。
 */
export function getTurnstileSecretKey() {
  if (isVercelPreview()) {
    return getPreviewTurnstileKeys().secretKey;
  }

  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  if (secretKey) return secretKey;
  if (process.env.NODE_ENV !== "production") return "";

  throw new TurnstileConfigurationError();
}
