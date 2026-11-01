"use client";

import Button, { type ButtonProps } from "@mui/material/Button";
import { useRef, type MouseEvent, type ReactNode } from "react";

import { useConfirmDialog } from "providers/ConfirmDialogProvider/ConfirmDialogProvider";

type DestructiveSubmitButtonProps = {
  confirmLabel?: ReactNode;
  description: ReactNode;
  disabled?: boolean;
  formId?: string;
  fullWidth?: boolean;
  label: ReactNode;
  size?: ButtonProps["size"];
  startIcon?: ReactNode;
  sx?: ButtonProps["sx"];
  title: ReactNode;
};

export function DestructiveSubmitButton({
  confirmLabel,
  description,
  disabled = false,
  formId,
  fullWidth = false,
  label,
  size,
  startIcon,
  sx,
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
      disabled={disabled}
      form={formId}
      fullWidth={fullWidth}
      onClick={confirmSubmit}
      size={size}
      startIcon={startIcon}
      sx={sx}
      type="button"
      variant="outlined"
    >
      {label}
    </Button>
  );
}
