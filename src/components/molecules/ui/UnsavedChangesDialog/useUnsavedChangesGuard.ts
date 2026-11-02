"use client";

import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useEffectEvent,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import { useUnsavedChangesCoordinator } from "providers/UnsavedChangesGuardProvider/UnsavedChangesGuardProvider";

type LeaveIntent = { type: "back" } | { type: "action"; action: () => void };

export function useUnsavedChangesGuard({
  isDirty,
  saveFormId,
  onClose,
  layer = null,
  active = true,
  disabled = false,
}: {
  isDirty: boolean;
  saveFormId: string | null;
  onClose?: () => void;
  /** 页面不传；只有真正的子弹层才传入层级。 */
  layer?: number | null;
  active?: boolean;
  disabled?: boolean;
}) {
  const router = useRouter();
  const saveIntent = useRef<LeaveIntent | null>(null);
  const [intent, setIntent] = useState<LeaveIntent | null>(null);
  const coordinator = useUnsavedChangesCoordinator();
  const [history] = useState(coordinator.createGuard);
  const runAction = useCallback(
    <T>(action: () => Promise<T>) => history.runAction(action),
    [history],
  );

  const back = useCallback(() => {
    if (layer !== null && onClose) onClose();
    else window.history.back();
  }, [layer, onClose]);
  const followIntent = useCallback(
    (leave: LeaveIntent) =>
      history.leave(leave.type === "back" ? back : leave.action),
    [history, back],
  );
  const completeSave = useCallback(
    (success: boolean) => {
      const leave = saveIntent.current;
      saveIntent.current = null;
      if (success && leave) return followIntent(leave);
      return Promise.resolve();
    },
    [followIntent],
  );

  const beforeUnload = useEffectEvent((event: BeforeUnloadEvent) => {
    if (!isDirty || !history.shouldBlockUnload()) return;
    event.preventDefault();
    event.returnValue = "";
  });
  const interceptClick = useEffectEvent((event: MouseEvent) => {
    if (!active || disabled || !history.isLinkOwner()) return;
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
    if (!isDirty) {
      void history.leave(back);
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

  // Next 的同页 revalidation 可在动作返回后的提交阶段重写 history.state；每次提交后同步登记。
  useLayoutEffect(() => {
    void history.update(isDirty, layer, active);
  });

  return {
    runAction,
    completeSave,
    runInPlaceAction: useCallback(
      <T>(action: () => Promise<T>) => history.runInPlaceAction(action),
      [history],
    ),
    requestNavigate: (action: () => void) => {
      if (!active || disabled) return;
      if (isDirty)
        setIntent((current) => current ?? { type: "action", action });
      else void history.leave(action);
    },
    requestClose: () => {
      if (!active || disabled || !onClose) return;
      if (isDirty)
        setIntent((current) => current ?? { type: "action", action: onClose });
      else void history.leave(onClose);
    },
    dialogProps: {
      open: intent !== null,
      onCancel: () => {
        saveIntent.current = null;
        setIntent(null);
      },
      onSave:
        saveFormId === null
          ? undefined
          : () => {
              setIntent(null);
              const form = document.getElementById(saveFormId);
              if (form instanceof HTMLFormElement) {
                saveIntent.current = form.checkValidity() ? intent : null;
                form.requestSubmit();
              }
            },
      onDiscard: () => {
        if (!intent) return;
        setIntent(null);
        saveIntent.current = null;
        void followIntent(intent);
      },
    },
  };
}
