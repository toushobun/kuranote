"use client";

import { useRouter } from "next/navigation";
import { useEffect, useEffectEvent, useState } from "react";

import {
  activateUnsavedChangesHistory,
  getUnsavedChangesHistory,
  subscribeUnsavedChangesHistory,
} from "./unsavedChangesHistory";

type LeaveIntent = { type: "back" } | { type: "action"; action: () => void };

export function useUnsavedChangesGuard({
  isDirty,
  onSave,
  saveFormId,
}: {
  isDirty: boolean;
} & (
  | { onSave: () => void; saveFormId?: never }
  | { onSave?: never; saveFormId: string }
)) {
  const router = useRouter();
  const [intent, setIntent] = useState<LeaveIntent | null>(null);
  const [history] = useState(getUnsavedChangesHistory);

  const beforeUnload = useEffectEvent((event: BeforeUnloadEvent) => {
    if (!isDirty || !history.shouldBlockUnload()) return;
    event.preventDefault();
    event.returnValue = "";
  });
  const interceptClick = useEffectEvent((event: MouseEvent) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    const link =
      event.target instanceof Element
        ? event.target.closest<HTMLAnchorElement>("a[href]")
        : null;
    if (
      !link ||
      link.hasAttribute("download") ||
      (link.target && link.target !== "_self")
    )
      return;
    const url = new URL(link.href, window.location.href);
    if (!/^https?:$/.test(url.protocol)) return;
    if (
      url.pathname === window.location.pathname &&
      url.search === window.location.search &&
      url.origin === window.location.origin
    )
      return;
    if (!isDirty && !history.needsCleanup()) return;
    event.preventDefault();
    event.stopPropagation();
    const navigate = () => {
      if (url.origin === window.location.origin)
        router.push(url.pathname + url.search + url.hash);
      else window.location.assign(url.href);
    };
    if (!isDirty) {
      void history.leave(navigate);
      return;
    }
    setIntent((current) => current ?? { type: "action", action: navigate });
  });

  useEffect(() => {
    const isCurrentConnection = history.connect(() =>
      setIntent((current) => current ?? { type: "back" }),
    );
    const deactivate = activateUnsavedChangesHistory(history);
    const unsubscribe = subscribeUnsavedChangesHistory();
    const click = (event: MouseEvent) => interceptClick(event);
    document.addEventListener("click", click, true);
    return () => {
      document.removeEventListener("click", click, true);
      queueMicrotask(() => {
        // Strict Mode 重执行 effect 时沿用同一个会话，不清理新连接的历史。
        if (!isCurrentConnection()) {
          unsubscribe();
          return;
        }
        // 清理遍历仍需接收 popstate，完成后再移除监听。
        void history.dispose().then(() => {
          if (isCurrentConnection()) deactivate();
          unsubscribe();
        });
      });
    };
  }, [history]);

  useEffect(() => {
    if (!isDirty) return;
    const unload = (event: BeforeUnloadEvent) => beforeUnload(event);
    window.addEventListener("beforeunload", unload);
    return () => window.removeEventListener("beforeunload", unload);
  }, [isDirty]);

  useEffect(() => {
    void history.setDirty(isDirty);
  }, [history, isDirty]);

  function requestLeave(action: () => void) {
    if (isDirty) setIntent((current) => current ?? { type: "action", action });
    else void history.leave(action);
  }

  return {
    requestLeave,
    dialogProps: {
      open: intent !== null,
      onCancel: () => setIntent(null),
      onSave: () => {
        setIntent(null);
        if (onSave) onSave();
        else {
          const form = document.getElementById(saveFormId);
          if (form instanceof HTMLFormElement) form.requestSubmit();
        }
      },
      onDiscard: () => {
        if (!intent) return;
        setIntent(null);
        void history.leave(
          intent.type === "back" ? () => window.history.back() : intent.action,
        );
      },
    },
  };
}
