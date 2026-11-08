"use client";

import {
  createContext,
  useContext,
  useId,
  useLayoutEffect,
  useState,
  type ReactNode,
} from "react";

import { unsavedChangesMessages } from "config/unsavedChangesMessages";
import { SuccessFeedbackDialog } from "molecules/ui/OperationFeedbackDialogs";
import { bottomNavigationLayout } from "organisms/navigation/bottomNavigationLayout";
import { createUnsavedChangesCoordinator } from "./unsavedChangesCoordinator";

const UnsavedChangesGuardContext = createContext<ReturnType<
  typeof createUnsavedChangesCoordinator
> | null>(null);

/** 实例与监听均属于当前 React 树，不在模块之间共享隐式单例。 */
export function UnsavedChangesGuardProvider({
  children,
}: {
  children: ReactNode;
}) {
  const prefix = useId();
  const [saveFeedback, setSaveFeedback] = useState({ id: 0, open: false });
  const [coordinator] = useState(() =>
    createUnsavedChangesCoordinator(
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
      `${prefix}-${Date.now()}`,
      () => setSaveFeedback(({ id }) => ({ id: id + 1, open: true })),
    ),
  );
  useLayoutEffect(() => {
    window.addEventListener("popstate", coordinator.handlePopState, true);
    return () =>
      window.removeEventListener("popstate", coordinator.handlePopState, true);
  }, [coordinator]);
  return (
    <UnsavedChangesGuardContext.Provider value={coordinator}>
      {children}
      <SuccessFeedbackDialog
        aboveModal
        bottomOffset={bottomNavigationLayout.feedbackBottomOffset}
        key={saveFeedback.id}
        onClose={() =>
          setSaveFeedback((current) => ({ ...current, open: false }))
        }
        open={saveFeedback.open}
        title={unsavedChangesMessages.saveSuccess}
      />
    </UnsavedChangesGuardContext.Provider>
  );
}

export function useUnsavedChangesCoordinator() {
  const coordinator = useContext(UnsavedChangesGuardContext);
  if (!coordinator)
    throw new Error("未保存守卫必须位于 UnsavedChangesGuardProvider 内。");
  return coordinator;
}

export function useOptionalUnsavedChangesCoordinator() {
  return useContext(UnsavedChangesGuardContext);
}
