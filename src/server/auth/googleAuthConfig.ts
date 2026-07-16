import "server-only";

export function isGoogleAuthEnabled() {
  return process.env.GOOGLE_AUTH_ENABLED === "true";
}
