"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  ConfirmationDialog,
  DeleteConfirmationDialog,
  type ConfirmationDialogProps,
} from "molecules/ui/OperationFeedbackDialogs";

export type ConfirmDialogOptions = Pick<
  ConfirmationDialogProps,
  "cancelLabel" | "confirmColor" | "confirmLabel" | "description" | "title"
> & {
  tone?: "default" | "delete";
};

type ConfirmDialog = (options: ConfirmDialogOptions) => Promise<boolean>;

const missingProvider: ConfirmDialog = () =>
  Promise.reject(
    new Error("useConfirmDialog must be used inside ConfirmDialogProvider"),
  );

const ConfirmDialogContext = createContext<ConfirmDialog>(missingProvider);

export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmDialogOptions | null>(null);
  const resolveRef = useRef<((result: boolean) => void) | null>(null);

  const confirm = useCallback((nextOptions: ConfirmDialogOptions) => {
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
      setOptions(nextOptions);
    });
  }, []);

  const closeDialog = useCallback((result: boolean) => {
    const resolve = resolveRef.current;
    resolveRef.current = null;
    setOptions(null);
    resolve?.(result);
  }, []);

  let dialog: ReactNode = null;

  if (options) {
    const { tone = "default", ...dialogProps } = options;

    dialog =
      tone === "delete" ? (
        <DeleteConfirmationDialog
          {...dialogProps}
          onCancel={() => closeDialog(false)}
          onConfirm={() => closeDialog(true)}
          open
        />
      ) : (
        <ConfirmationDialog
          {...dialogProps}
          onCancel={() => closeDialog(false)}
          onConfirm={() => closeDialog(true)}
          open
        />
      );
  }

  return (
    <ConfirmDialogContext.Provider value={confirm}>
      {children}
      {dialog}
    </ConfirmDialogContext.Provider>
  );
}

export function useConfirmDialog() {
  return useContext(ConfirmDialogContext);
}
