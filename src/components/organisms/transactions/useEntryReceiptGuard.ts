"use client";

import { useLayoutEffect, useState } from "react";
import { useUnsavedChangesGuard } from "molecules/ui/UnsavedChangesDialog/useUnsavedChangesGuard";
import { useWizardDialogSwitchPane } from "molecules/ui/WizardDialog/wizardDialogSwitchContext";

export type EntryReceiptDraft = {
  otherTouched: boolean;
  onTouched: () => void;
};

export function useEntryReceiptGuard(
  dirty: boolean,
  saveFormId: string,
  onClose: () => void,
  draft?: EntryReceiptDraft,
) {
  const active = useWizardDialogSwitchPane()?.active ?? true;
  // 守卫随面板停用，草稿的修改记录保留到页面卸载。
  const [touched, setTouched] = useState(false);
  if (dirty && !touched) setTouched(true);
  const onTouched = draft?.onTouched;
  useLayoutEffect(() => {
    if (touched) onTouched?.();
  }, [touched, onTouched]);
  const guard = useUnsavedChangesGuard({
    active,
    isDirty: touched || !!draft?.otherTouched,
    saveFormId,
    onClose,
  });
  return { guard, touched };
}
