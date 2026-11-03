import { render, type RenderOptions } from "@testing-library/react";
import type { ReactNode } from "react";
import { vi } from "vitest";
import { EditTransactionDirtyProvider } from "organisms/transactions/EditTransactionDirtyContext/EditTransactionDirtyContext";

export function renderDirtyForm(ui: ReactNode, options?: RenderOptions) {
  const onDirty = vi.fn<(dirty: boolean) => void>();
  return {
    onDirty,
    ...render(
      <EditTransactionDirtyProvider onDirty={onDirty}>
        {ui}
      </EditTransactionDirtyProvider>,
      options,
    ),
  };
}
