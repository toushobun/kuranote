"use client";

import Button from "@mui/material/Button";
import { useRef, type MouseEvent, type ReactNode } from "react";

import { useConfirmDialog } from "providers/ConfirmDialogProvider/ConfirmDialogProvider";

type DestructiveSubmitButtonProps = {
  confirmLabel?: ReactNode;
  description: ReactNode;
  formId?: string;
  fullWidth?: boolean;
  label: ReactNode;
  startIcon?: ReactNode;
  title: ReactNode;
};

export function DestructiveSubmitButton({
  confirmLabel,
  description,
  formId,
  fullWidth = false,
  label,
  startIcon,
  title,
}: DestructiveSubmitButtonProps) {
  const confirm = useConfirmDialog();
  const formRef = useRef<HTMLFormElement | null>(null);

  async function confirmSubmit(event: MouseEvent<HTMLButtonElement>) {
    formRef.current = event.currentTarget.form;
    const ok = await confirm({
      confirmLabel: confirmLabel ?? label,
      description,
      title,
      tone: "delete",
    });

    if (ok) {
      formRef.current?.requestSubmit();
    }
  }

  return (
    <Button
      color="error"
      form={formId}
      fullWidth={fullWidth}
      onClick={confirmSubmit}
      startIcon={startIcon}
      type="button"
      variant="outlined"
    >
      {label}
    </Button>
  );
}
