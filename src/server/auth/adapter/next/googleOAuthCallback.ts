import { NextResponse } from "next/server";

import {
  getGoogleAuthSource,
  getSafeGoogleAuthNextPath,
  googleAuthErrorCodes,
  googleAuthFailureHref,
} from "lib/auth/googleOAuth";
import { createRequestContainer } from "server/container";
import { createServerRequestDependencies } from "server/shared/context/createServerRequestDependencies";
import { AppError } from "server/shared/errors/appError";

function redirectTo(requestUrl: URL, path: string): NextResponse {
  return NextResponse.redirect(new URL(path, requestUrl.origin));
}

export async function handleGoogleOAuthCallback(
  request: Request,
): Promise<NextResponse> {
  const requestUrl = new URL(request.url);
  const source = getGoogleAuthSource(requestUrl.searchParams.get("source"));
  const nextPath = getSafeGoogleAuthNextPath(
    requestUrl.searchParams.get("next"),
  );

  try {
    const dependencies = await createServerRequestDependencies();
    const redirectPath = await createRequestContainer(
      dependencies,
    ).auth.service.completeGoogleAuth({
      code: requestUrl.searchParams.get("code"),
      nextPath,
      providerError: requestUrl.searchParams.get("error"),
      source,
    });

    return redirectTo(requestUrl, redirectPath);
  } catch (error) {
    if (!(error instanceof AppError)) {
      console.error("[auth] OAuth callback failed unexpectedly", {
        errorName: error instanceof Error ? error.name : "unknown",
      });
    }

    // Repository 已记录应用错误；其他异常也只保留类型并维持安全失败跳转。
    return redirectTo(
      requestUrl,
      googleAuthFailureHref(
        source,
        googleAuthErrorCodes.callbackFailed,
        nextPath,
      ),
    );
  }
}
