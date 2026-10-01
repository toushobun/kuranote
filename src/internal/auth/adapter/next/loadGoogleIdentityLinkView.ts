import {
  getGoogleIdentityLinkResult,
  googleIdentityLinkResults,
  type GoogleIdentityLinkResult,
} from "lib/auth/googleOAuth";
import type {
  GoogleIdentityLinkFeedback,
  GoogleIdentityStatus,
} from "internal/auth/entity/auth";
import { googleIdentityLinkMessages } from "internal/auth/errors";
import { createRequestContainer } from "internal/container";
import { createServerRequestDependencies } from "internal/shared/context/createServerRequestDependencies";

export type GoogleIdentityLinkView = {
  googleIdentity: GoogleIdentityStatus;
  linkFeedback: GoogleIdentityLinkFeedback | null;
};

const linkFailureMessages: Record<
  Exclude<GoogleIdentityLinkResult, typeof googleIdentityLinkResults.linked>,
  string
> = {
  cancelled: googleIdentityLinkMessages.cancelled,
  failed: googleIdentityLinkMessages.callbackFailed,
  identity_already_exists: googleIdentityLinkMessages.identityAlreadyExists,
};

function toLinkFeedback(
  value: string | undefined,
): GoogleIdentityLinkFeedback | null {
  const result = getGoogleIdentityLinkResult(value);

  if (!result) return null;
  if (result === googleIdentityLinkResults.linked) return { kind: "success" };
  return { kind: "failure", message: linkFailureMessages[result] };
}

/**
 * 个人主页账号绑定区域的读取：绑定状态只从服务端会话读取；
 * linkResult 只接受已知值并映射为安全文案。加载失败交给页面错误边界处理。
 */
export async function loadGoogleIdentityLinkView(
  linkResult: string | undefined,
): Promise<GoogleIdentityLinkView> {
  const dependencies = await createServerRequestDependencies();
  const googleIdentity =
    await createRequestContainer(
      dependencies,
    ).auth.service.getGoogleIdentityStatus();

  return { googleIdentity, linkFeedback: toLinkFeedback(linkResult) };
}
