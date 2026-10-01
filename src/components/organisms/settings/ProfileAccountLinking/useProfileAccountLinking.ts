"use client";

import { useActionState, useCallback, useState, useTransition } from "react";

import { profileAccountLinkingMessages as text } from "config/settingsMessages";
import { googleIdentityLinkResultParam } from "lib/auth/googleOAuth";
import type { GoogleIdentityLinkFeedback } from "internal/auth";
import type { OperationFeedbackState } from "molecules/ui/OperationFeedbackDialogs";
import { useConfirmDialog } from "providers/ConfirmDialogProvider/ConfirmDialogProvider";
import type {
  GoogleIdentityLinkAction,
  GoogleIdentityLinkActionState,
} from "types/auth";
import { useClearQueryParam } from "templates/useClearQueryParam";

const initialActionState: GoogleIdentityLinkActionState = {};

function toInitialFeedback(
  linkFeedback: GoogleIdentityLinkFeedback | null,
): OperationFeedbackState | null {
  if (!linkFeedback) return null;
  return linkFeedback.kind === "success"
    ? { kind: "success", title: text.linkSuccessTitle }
    : {
        kind: "failure",
        message: linkFeedback.message,
        title: text.linkFailureTitle,
      };
}

/**
 * 账号绑定区域：绑定跳转 Google 授权，解除绑定需二次确认。
 * Google 授权回跳的结果（linkResult）在挂载时展示，关闭反馈后从 URL 中移除。
 */
export function useProfileAccountLinking({
  googleEmail,
  linkAction,
  linkFeedback,
  unlinkAction,
}: {
  googleEmail: string | null;
  linkAction: GoogleIdentityLinkAction;
  linkFeedback: GoogleIdentityLinkFeedback | null;
  unlinkAction: GoogleIdentityLinkAction;
}) {
  const confirm = useConfirmDialog();
  const clearLinkResultParam = useClearQueryParam(
    googleIdentityLinkResultParam,
  );
  // 从 Google 授权回跳时展开区域，方便确认绑定结果。
  const [expanded, setExpanded] = useState(linkFeedback !== null);
  const [feedback, setFeedback] = useState(() =>
    toInitialFeedback(linkFeedback),
  );
  const [hasLinkResultParam, setHasLinkResultParam] = useState(
    linkFeedback !== null,
  );
  const [, startTransition] = useTransition();

  const trackedLinkAction = useCallback<GoogleIdentityLinkAction>(
    async (previousState) => {
      // 成功时 Server Action 直接跳转到 Google 授权页，这里只处理失败。
      const nextState = await linkAction(previousState);

      if (nextState.error) {
        setFeedback({
          kind: "failure",
          message: nextState.error,
          title: text.linkFailureTitle,
        });
      }

      return nextState;
    },
    [linkAction],
  );
  const [, linkFormAction, isLinking] = useActionState(
    trackedLinkAction,
    initialActionState,
  );

  const trackedUnlinkAction = useCallback<GoogleIdentityLinkAction>(
    async (previousState) => {
      const nextState = await unlinkAction(previousState);

      if (nextState.error) {
        setFeedback({
          kind: "failure",
          message: nextState.error,
          title: text.unlinkFailureTitle,
        });
      } else if (nextState.success) {
        setFeedback({ kind: "success", title: text.unlinkSuccessTitle });
      }

      return nextState;
    },
    [unlinkAction],
  );
  const [, unlinkFormAction, isUnlinking] = useActionState(
    trackedUnlinkAction,
    initialActionState,
  );

  function link() {
    startTransition(() => linkFormAction());
  }

  async function unlink() {
    const confirmed = await confirm({
      confirmColor: "error",
      confirmLabel: text.unlink,
      description: text.unlinkConfirmDescription(googleEmail),
      title: text.unlinkConfirmTitle,
    });

    if (confirmed) startTransition(() => unlinkFormAction());
  }

  function closeFeedback() {
    setFeedback(null);

    if (hasLinkResultParam) {
      setHasLinkResultParam(false);
      clearLinkResultParam();
    }
  }

  return {
    closeFeedback,
    expanded,
    feedback,
    isLinking,
    isUnlinking,
    link,
    pending: isLinking || isUnlinking,
    toggleExpanded: () => setExpanded((value) => !value),
    unlink,
  };
}
