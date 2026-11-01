"use client";

import {
  createContext,
  useContext,
  useId,
  useLayoutEffect,
  useState,
  type ReactNode,
} from "react";

import { UnsavedChangesHistory } from "molecules/ui/UnsavedChangesDialog/unsavedChangesHistory";

function createCoordinator(prefix: string) {
  const registrations = new Set<UnsavedChangesHistory>();
  let nextId = 0;
  const current = () => [...registrations].at(-1);
  return {
    createHistory: () =>
      new UnsavedChangesHistory(
        {
          state: () => window.history.state,
          href: () => window.location.href,
          replace: (state) =>
            window.history.replaceState(state, "", window.location.href),
          push: (state) =>
            window.history.pushState(state, "", window.location.href),
          go: (delta) => window.history.go(delta),
          scrollPosition: () => ({ x: window.scrollX, y: window.scrollY }),
          scrollTo: ({ x, y }) =>
            window.scrollTo({ left: x, top: y, behavior: "instant" }),
          scrollRestoration: () => window.history.scrollRestoration ?? "auto",
          setScrollRestoration: (mode) => {
            window.history.scrollRestoration = mode;
          },
          afterTraversal: (callback) => window.requestAnimationFrame(callback),
        },
        () => {},
        `${prefix}-${Date.now()}-${++nextId}`,
      ),
    register: (history: UnsavedChangesHistory, onBack: () => void) => {
      const isCurrentConnection = history.connect(onBack);
      registrations.delete(history);
      registrations.add(history);
      return () => {
        queueMicrotask(() => {
          if (!isCurrentConnection()) return;
          void history.dispose().then(() => {
            if (isCurrentConnection()) registrations.delete(history);
          });
        });
      };
    },
    handlePopState: (event: PopStateEvent) => {
      if (current()?.handlePopState()) event.stopImmediatePropagation();
    },
    runAction: <T,>(action: () => Promise<T>) =>
      current()?.runAction(action) ?? action(),
  };
}

const UnsavedChangesGuardContext = createContext<ReturnType<
  typeof createCoordinator
> | null>(null);

/** 实例与监听均属于当前 React 树，不在模块之间共享隐式单例。 */
export function UnsavedChangesGuardProvider({
  children,
}: {
  children: ReactNode;
}) {
  const prefix = useId();
  const [coordinator] = useState(() => createCoordinator(prefix));
  useLayoutEffect(() => {
    window.addEventListener("popstate", coordinator.handlePopState, true);
    return () =>
      window.removeEventListener("popstate", coordinator.handlePopState, true);
  }, [coordinator]);
  return (
    <UnsavedChangesGuardContext.Provider value={coordinator}>
      {children}
    </UnsavedChangesGuardContext.Provider>
  );
}

export function useUnsavedChangesCoordinator() {
  const coordinator = useContext(UnsavedChangesGuardContext);
  if (!coordinator)
    throw new Error("未保存守卫必须位于 UnsavedChangesGuardProvider 内。");
  return coordinator;
}
