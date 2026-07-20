import { handleGoogleOAuthCallback } from "server/auth/adapter/next/googleOAuthCallback";

export async function GET(request: Request) {
  return handleGoogleOAuthCallback(request);
}
