import { NextResponse } from "next/server";

import {
  getGoogleAuthSource,
  getSafeGoogleAuthNextPath,
  googleAuthErrorCodes,
  googleAuthFailureHref,
} from "lib/auth/googleOAuth";
import { createClient } from "lib/supabase/server";
import { isGoogleAuthEnabled } from "server/auth/googleAuthConfig";

function redirectTo(requestUrl: URL, path: string) {
  return NextResponse.redirect(new URL(path, requestUrl.origin));
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const source = getGoogleAuthSource(requestUrl.searchParams.get("source"));
  const nextPath = getSafeGoogleAuthNextPath(
    requestUrl.searchParams.get("next"),
  );

  if (!isGoogleAuthEnabled()) {
    return redirectTo(
      requestUrl,
      googleAuthFailureHref(source, googleAuthErrorCodes.startFailed, nextPath),
    );
  }

  const providerError = requestUrl.searchParams.get("error");

  if (providerError) {
    const errorCode =
      providerError === "access_denied"
        ? googleAuthErrorCodes.cancelled
        : googleAuthErrorCodes.callbackFailed;

    return redirectTo(
      requestUrl,
      googleAuthFailureHref(source, errorCode, nextPath),
    );
  }

  const code = requestUrl.searchParams.get("code");

  if (!code) {
    return redirectTo(
      requestUrl,
      googleAuthFailureHref(
        source,
        googleAuthErrorCodes.callbackFailed,
        nextPath,
      ),
    );
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return redirectTo(
        requestUrl,
        googleAuthFailureHref(
          source,
          googleAuthErrorCodes.callbackFailed,
          nextPath,
        ),
      );
    }
  } catch (error) {
    console.error("googleOAuthCallback failed", error);

    return redirectTo(
      requestUrl,
      googleAuthFailureHref(
        source,
        googleAuthErrorCodes.callbackFailed,
        nextPath,
      ),
    );
  }

  return redirectTo(requestUrl, nextPath);
}
