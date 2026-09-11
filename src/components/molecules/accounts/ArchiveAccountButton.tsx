"use client";

import type { ReactNode } from "react";

import { DestructiveSubmitButton } from "molecules/ui/DestructiveSubmitButton/DestructiveSubmitButton";

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
  return (
    <DestructiveSubmitButton
      confirmLabel="删除账户"
      description={description}
      formId={formId}
      label={label}
      title={title}
    />
  );
}
