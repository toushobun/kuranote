"use client";

import { createContext, useContext, type ReactNode } from "react";

export type EditDirtySource = "form" | "photos";
const EditTransactionDirtyContext = createContext<
  ((dirty: boolean, source?: EditDirtySource) => void) | null
>(null);

export function EditTransactionDirtyProvider({
  children,
  onDirty,
}: {
  children: ReactNode;
  onDirty: (dirty: boolean, source?: EditDirtySource) => void;
}) {
  return (
    <EditTransactionDirtyContext.Provider value={onDirty}>
      {children}
    </EditTransactionDirtyContext.Provider>
  );
}

export function useEditTransactionDirty() {
  return useContext(EditTransactionDirtyContext);
}
