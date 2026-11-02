"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffectEvent,
  useLayoutEffect,
  useState,
  type ReactNode,
} from "react";
import { useOptionalUnsavedChangesCoordinator } from "providers/UnsavedChangesGuardProvider/UnsavedChangesGuardProvider";

export const transactionBackLayerLevels = {
  flow: 0,
  pageOverlay: 1,
  receiptEditor: 1,
  creation: 2,
} as const;

const BackLayerContext = createContext<number | null>(null);

/** 由页面显式启用弹层后退栈；隐藏面板和无作用域调用方不自动登记。 */
export function BackLayerScope({
  level,
  children,
}: {
  level: number | null;
  children: ReactNode;
}) {
  return (
    <BackLayerContext.Provider value={level}>
      {children}
    </BackLayerContext.Provider>
  );
}
export function useBackLayerLevel() {
  return useContext(BackLayerContext);
}

export function useBackLayer(open: boolean, onClose: () => void, offset = 0) {
  const level = useBackLayerLevel();
  const coordinator = useOptionalUnsavedChangesCoordinator();
  const [entry] = useState(() => coordinator?.createGuard(false));
  const close = useEffectEvent(onClose);
  useLayoutEffect(() => {
    if (level === null) return;
    return entry?.register(() => close());
  }, [entry, level]);
  useLayoutEffect(() => {
    if (level !== null) void entry?.update(false, level + offset, open);
  }, [entry, level, open, offset]);

  const navigate = useCallback(
    (action: () => void) => {
      if (level !== null && entry) return entry.navigate(action);
      action();
      return Promise.resolve();
    },
    [entry, level],
  );
  const runAction = useCallback(
    <T,>(action: () => Promise<T>) =>
      level !== null && entry ? entry.runAction(action) : action(),
    [entry, level],
  );
  return { navigate, runAction };
}
