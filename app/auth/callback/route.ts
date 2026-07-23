import { handleGoogleOAuthCallback } from "internal/auth/adapter/next/googleOAuthCallback";

export async function GET(request: Request) {
  return handleGoogleOAuthCallback(request);
}
