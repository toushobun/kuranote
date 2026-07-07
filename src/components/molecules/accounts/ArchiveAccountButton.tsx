"use client";

import Button from "@mui/material/Button";
import { useRef, useState, type MouseEvent, type ReactNode } from "react";

import { DeleteConfirmationDialog } from "molecules/ui/OperationFeedbackDialogs";

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
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const formRef = useRef<HTMLFormElement | null>(null);

  function openConfirm(event: MouseEvent<HTMLButtonElement>) {
    formRef.current = event.currentTarget.form;
    setIsConfirmOpen(true);
  }

  function closeConfirm() {
    setIsConfirmOpen(false);
  }

  function submitArchiveForm() {
    setIsConfirmOpen(false);
    formRef.current?.requestSubmit();
  }

  return (
    <>
      <Button
        color="error"
        form={formId}
        onClick={openConfirm}
        type="button"
        variant="outlined"
      >
        {label}
      </Button>
      {isConfirmOpen ? (
        <DeleteConfirmationDialog
          description={description}
          onCancel={closeConfirm}
          onConfirm={submitArchiveForm}
          open={isConfirmOpen}
          title={title}
        />
      ) : null}
    </>
  );
}
