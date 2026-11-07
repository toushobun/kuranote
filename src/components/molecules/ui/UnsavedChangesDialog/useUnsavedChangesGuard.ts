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
type SaveIntent = { formId: string; leave: LeaveIntent };

export function useUnsavedChangesGuard({
  isDirty,
  saveFormId,
  onClose,
  layer = null,
  active = true,
  disabled = false,
  confirmOnLeave = false,
  saveOnLeave,
  saveLabel,
  cleanDescription,
}: {
  isDirty: boolean;
  saveFormId: string | null;
  onClose?: () => void;
  /** 页面不传；只有真正的子弹层才传入层级。 */
  layer?: number | null;
  active?: boolean;
  disabled?: boolean;
  /** 仅指定业务流程启用：即使当前草稿与快照相同，主动退出仍需确认。 */
  confirmOnLeave?: boolean;
  /** 纯异步保存入口；成功返回 true，由现有离开意图完成导航。 */
  saveOnLeave?: () => Promise<boolean>;
  saveLabel?: string;
  cleanDescription?: string;
}) {
  const router = useRouter();
  const mustConfirm = isDirty || confirmOnLeave;
  const saveIntent = useRef<SaveIntent | null>(null);
  const [intent, setIntent] = useState<LeaveIntent | null>(null);
  const coordinator = useUnsavedChangesCoordinator();
  const [history] = useState(coordinator.createGuard);
  const runAction = useCallback(
    async <T>(action: () => Promise<T>) => {
      try {
        return await history.runAction(action);
      } finally {
        // 普通表单提交结束或失败后，不得保留旧的离开意图。
        saveIntent.current = null;
      }
    },
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
    (success: boolean, formId: string) => {
      const saved = saveIntent.current;
      if (saved?.formId !== formId) return Promise.resolve();
      saveIntent.current = null;
      if (success) return followIntent(saved.leave);
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
    if (!mustConfirm && !history.needsCleanup()) return;
    event.preventDefault();
    event.stopPropagation();
    const navigate = () => {
      if (url.origin === window.location.origin)
        router.push(url.pathname + url.search + url.hash);
      else window.location.assign(url.href);
    };
    if (!mustConfirm) {
      void history.leave(navigate);
      return;
    }
    setIntent((current) => current ?? { type: "action", action: navigate });
  });

  const requestBack = useEffectEvent(() => {
    if (!active || disabled) return;
    if (!mustConfirm) {
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
    void history.update(mustConfirm, layer, active);
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
      if (mustConfirm)
        setIntent((current) => current ?? { type: "action", action });
      else void history.leave(action);
    },
    requestClose: () => {
      if (!active || disabled || !onClose) return;
      if (mustConfirm)
        setIntent((current) => current ?? { type: "action", action: onClose });
      else void history.leave(onClose);
    },
    dialogProps: {
      open: intent !== null,
      description: !isDirty ? cleanDescription : undefined,
      saveLabel,
      onCancel: () => {
        saveIntent.current = null;
        setIntent(null);
      },
      onSave:
        saveFormId === null
          ? saveOnLeave
            ? () => {
                if (!intent) return;
                const leave = intent;
                setIntent(null);
                // 与普通表单共用 save intent，只有保存成功才执行原离开动作。
                const formId = "__async_leave__";
                saveIntent.current = { formId, leave };
                void (async () => {
                  try {
                    const saved = await history.runAction(saveOnLeave);
                    await completeSave(saved, formId);
                  } catch {
                    // 保存回调负责反馈错误；守卫保持当前页面供重试。
                    saveIntent.current = null;
                  }
                })();
              }
            : undefined
          : () => {
              setIntent(null);
              saveIntent.current = null;
              const form = document.getElementById(saveFormId);
              if (form instanceof HTMLFormElement) {
                if (form.checkValidity() && intent)
                  saveIntent.current = { formId: saveFormId, leave: intent };
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
