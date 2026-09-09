"use client";

import { useState } from "react";

import type { CategoryActionState } from "types/categories";

export function useCategoryActionSuccess(
  state: CategoryActionState | undefined,
  onSuccess: () => void,
) {
  const [previousState, setPreviousState] = useState(state);
  if (state !== previousState) {
    setPreviousState(state);
    if (state?.success) onSuccess();
  }
}
