"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { routePaths } from "config/paths";
import {
  getSafeGoogleAuthNextPath,
  googleAuthErrorCodes,
  googleAuthFailureHref,
  type GoogleAuthSource,
} from "lib/auth/googleOAuth";
import { createClient } from "lib/supabase/server";
import { isGoogleAuthEnabled } from "server/auth/googleAuthConfig";

function getRequestOrigin(value: string | null) {
  if (!value) return null;

  try {
    const url = new URL(value);

    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (url.username || url.password) return null;
    if (url.pathname !== "/" || url.search || url.hash) return null;

    return url.origin;
  } catch {
    return null;
  }
}

export async function startGoogleAuth(
  source: GoogleAuthSource,
  nextPath: string,
): Promise<void> {
  const safeNextPath = getSafeGoogleAuthNextPath(nextPath);
  const failureHref = googleAuthFailureHref(
    source,
    googleAuthErrorCodes.startFailed,
    safeNextPath,
  );

  if (!isGoogleAuthEnabled()) {
    redirect(failureHref);
  }

  const requestOrigin = getRequestOrigin((await headers()).get("origin"));

  if (!requestOrigin) {
    redirect(failureHref);
  }

  const callbackUrl = new URL(routePaths.authCallback, requestOrigin);
  callbackUrl.searchParams.set("source", source);
  callbackUrl.searchParams.set("next", safeNextPath);

  let providerUrl: string | null = null;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callbackUrl.toString(),
      },
    });

    if (!error) {
      providerUrl = data.url;
    }
  } catch (error) {
    console.error("startGoogleAuth failed", error);
    providerUrl = null;
  }

  if (!providerUrl) {
    redirect(failureHref);
  }

  redirect(providerUrl);
}
