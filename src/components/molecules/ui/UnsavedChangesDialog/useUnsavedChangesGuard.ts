"use client";

import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useEffectEvent,
  useLayoutEffect,
  useState,
} from "react";

import { useUnsavedChangesCoordinator } from "providers/UnsavedChangesGuardProvider/UnsavedChangesGuardProvider";

import { useBackLayerLevel } from "./BackLayerScope";

type LeaveIntent = { type: "back" } | { type: "action"; action: () => void };

export function useUnsavedChangesGuard({
  isDirty,
  saveFormId,
  onClose,
  active = true,
  disabled = false,
}: {
  isDirty: boolean;
  saveFormId: string;
  onClose?: () => void;
  active?: boolean;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [intent, setIntent] = useState<LeaveIntent | null>(null);
  const coordinator = useUnsavedChangesCoordinator();
  const [history] = useState(coordinator.createGuard);
  const level = useBackLayerLevel();
  const layer = onClose && level !== null ? level : null;
  const runAction = useCallback(
    <T>(action: () => Promise<T>) => history.runAction(action),
    [history],
  );

  const beforeUnload = useEffectEvent((event: BeforeUnloadEvent) => {
    if (!isDirty || !history.shouldBlockUnload()) return;
    event.preventDefault();
    event.returnValue = "";
  });
  const interceptClick = useEffectEvent((event: MouseEvent) => {
    if (!active || disabled || !history.isTop()) return;
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

  const requestBack = useEffectEvent(() => {
    if (!active || disabled) return;
    if (!isDirty && onClose) {
      void history.leave(onClose);
      return;
    }
    setIntent((current) => current ?? { type: "back" });
  });
  useLayoutEffect(() => {
    const unregister = history.register(() => requestBack());
    const click = (event: MouseEvent) => interceptClick(event);
    document.addEventListener("click", click, true);
    return () => {
      document.removeEventListener("click", click, true);
      unregister();
    };
  }, [coordinator, history]);

  useEffect(() => {
    if (!isDirty) return;
    const unload = (event: BeforeUnloadEvent) => beforeUnload(event);
    window.addEventListener("beforeunload", unload);
    return () => window.removeEventListener("beforeunload", unload);
  }, [isDirty]);

  useLayoutEffect(() => {
    void history.update(isDirty, layer, active);
  }, [history, isDirty, layer, active]);

  return {
    runAction,
    requestClose: () => {
      if (!active || disabled || !onClose) return;
      if (isDirty)
        setIntent((current) => current ?? { type: "action", action: onClose });
      else void history.leave(onClose);
    },
    dialogProps: {
      open: intent !== null,
      onCancel: () => setIntent(null),
      onSave: () => {
        setIntent(null);
        const form = document.getElementById(saveFormId);
        if (form instanceof HTMLFormElement) form.requestSubmit();
      },
      onDiscard: () => {
        if (!intent) return;
        setIntent(null);
        void history.leave(
          intent.type === "back"
            ? (onClose ?? (() => window.history.back()))
            : intent.action,
        );
      },
    },
  };
}
