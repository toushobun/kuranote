import "server-only";

import { turnstileTestSecretKey, turnstileTestSiteKey } from "config/turnstile";

const vercelPreviewEnv = "preview";

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

export function getTurnstileSecretKey() {
  if (isVercelPreview()) {
    return getPreviewTurnstileKeys().secretKey;
  }

  return process.env.TURNSTILE_SECRET_KEY || "";
}
