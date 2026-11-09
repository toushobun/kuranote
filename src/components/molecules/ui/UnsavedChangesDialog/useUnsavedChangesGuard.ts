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
import { saveAndLeaveField } from "config/unsavedChanges";
import type { ActionState } from "types/actions";

type LeaveIntent =
  | { type: "back" }
  | { type: "action" | "close"; action: () => void };
type SaveIntent = { formId: string; leave: LeaveIntent };

export function useUnsavedChangesGuard({
  isDirty: changed,
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
  /** 当前内容是否与基线不同；出现过一次即视为动过（见下方 `touched`）。 */
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
  // 动过就算修改：内容改回原样也仍需确认，直到保存成功或守卫失效（弹层关闭）。
  // 按保存表单分别记录（标准页的收支 / 转账面板各自独立），只记已提交的变化。
  const touchedKey = saveFormId ?? "";
  const [touchedKeys, setTouchedKeys] = useState<readonly string[]>([]);
  // 保存成功后，页面重设基线前的旧 dirty 不再记为动过。
  const [savedClean, setSavedClean] = useState(false);
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- 按已提交的 dirty 维护「动过」状态。 */
    if (!active) setTouchedKeys([]);
    else if (!changed) setSavedClean(false);
    else if (!savedClean)
      setTouchedKeys((keys) =>
        keys.includes(touchedKey) ? keys : [...keys, touchedKey],
      );
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [active, changed, savedClean, touchedKey]);
  const markSaved = useCallback(() => {
    setTouchedKeys((keys) => keys.filter((key) => key !== touchedKey));
    setSavedClean(true);
  }, [touchedKey]);
  const isDirty = changed || touchedKeys.includes(touchedKey);
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
    (leave: LeaveIntent, saved = false) => {
      const closesLayer =
        layer !== null && !!onClose && leave.type !== "action";
      return history.leave(
        leave.type === "back" ? back : leave.action,
        saved ? (closesLayer ? "close" : "route") : null,
      );
    },
    [history, back, layer, onClose],
  );
  const isSavingToLeave = useCallback(
    (formId: string) => saveIntent.current?.formId === formId,
    [],
  );
  const completeSave = useCallback(
    async (success: boolean, formId: string) => {
      if (success) markSaved();
      const saved = saveIntent.current;
      if (saved?.formId !== formId) return false;
      saveIntent.current = null;
      if (success) await followIntent(saved.leave, true);
      return true;
    },
    [followIntent, markSaved],
  );
  const runSaveAction = useCallback(
    async <T extends ActionState>(
      formData: FormData,
      action: (data: FormData) => Promise<T>,
      shouldRetry?: (state: T) => boolean,
    ) => {
      const pending = saveIntent.current;
      const leave = pending?.formId === saveFormId ? pending : null;
      if (leave) {
        saveIntent.current = null;
        formData.set(saveAndLeaveField, "true");
      } else {
        formData.delete(saveAndLeaveField);
      }
      const result = await history.runAction(() => action(formData));
      if (result.success && !result.error) markSaved();
      if (leave && !saveIntent.current) {
        if (result.success && !result.error) {
          await followIntent(leave.leave, true);
          return { ...result, success: undefined };
        }
        if (shouldRetry?.(result)) saveIntent.current = leave;
      }
      return result;
    },
    [followIntent, history, markSaved, saveFormId],
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
    runSaveAction,
    // 客户端表单校验拦截提交时，清除未完成的保存后退出意图。
    cancelSave: () => {
      saveIntent.current = null;
    },
    completeSave,
    isSavingToLeave,
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
        setIntent((current) => current ?? { type: "close", action: onClose });
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
