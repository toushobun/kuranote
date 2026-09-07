"use client";

import Button from "@mui/material/Button";
import { useRef, type MouseEvent, type ReactNode } from "react";

import { useConfirmDialog } from "providers/ConfirmDialogProvider/ConfirmDialogProvider";

type ArchiveAccountButtonProps = {
  description?: ReactNode;
  formId?: string;
  label?: ReactNode;
  title?: ReactNode;
};

export function ArchiveAccountButton({
  description = "删除后该账户将从账户列表中隐藏，历史记录不会被删除。",
  formId,
  label = "删除账户",
  title = "删除账户？",
}: ArchiveAccountButtonProps) {
  const confirm = useConfirmDialog();
  const formRef = useRef<HTMLFormElement | null>(null);

  async function confirmArchive(event: MouseEvent<HTMLButtonElement>) {
    formRef.current = event.currentTarget.form;
    const ok = await confirm({
      confirmLabel: "删除账户",
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
      onClick={confirmArchive}
      type="button"
      variant="outlined"
    >
      {label}
    </Button>
  );
}
