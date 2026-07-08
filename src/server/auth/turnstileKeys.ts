import "server-only";

import {
  turnstileTestSecretKey,
  turnstileTestSiteKey,
} from "config/turnstile";

const vercelPreviewEnv = "preview";

function isVercelPreview() {
  return process.env.VERCEL_ENV === vercelPreviewEnv;
}

export function getTurnstileSiteKey() {
  if (isVercelPreview()) {
    return (
      process.env.NEXT_PUBLIC_TURNSTILE_PREVIEW_SITE_KEY || turnstileTestSiteKey
    );
  }

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  if (siteKey) return siteKey;
  if (process.env.NODE_ENV !== "production") return turnstileTestSiteKey;

  throw new Error("NEXT_PUBLIC_TURNSTILE_SITE_KEY is required in production.");
}

export function getTurnstileSecretKey() {
  if (isVercelPreview()) {
    return process.env.TURNSTILE_PREVIEW_SECRET_KEY || turnstileTestSecretKey;
  }

  return process.env.TURNSTILE_SECRET_KEY || "";
}
