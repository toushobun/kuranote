import { useEffect } from "react";
import { useDirtySnapshot } from "molecules/ui/UnsavedChangesDialog/useDirtySnapshot";

export function useLedgerSetupStepDirty(
  snapshot: unknown,
  onDirtyChange?: (dirty: boolean) => void,
) {
  useDirtySnapshot(JSON.stringify(snapshot), onDirtyChange ?? null, true);
  useEffect(() => () => onDirtyChange?.(false), [onDirtyChange]);
}
