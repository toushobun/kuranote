"use client";

import { useState } from "react";
import type { ActionState } from "types/actions";
import { useUnsavedChangesGuard } from "./useUnsavedChangesGuard";

/** 表单保留自己的快照，页面只协调 dirty 上报与提交。 */
export function useUnsavedChangesForm<State extends ActionState>(
  saveFormId: string,
  action: (state: State, data: FormData) => Promise<State>,
) {
  const [dirty, onDirtyChange] = useState(false);
  const guard = useUnsavedChangesGuard({ isDirty: dirty, saveFormId });
  return {
    onDirtyChange,
    dialogProps: guard.dialogProps,
    action: (state: State, data: FormData) =>
      guard.runSaveAction(data, (values) => action(state, values)),
  };
}
