"use client";

import Button from "@mui/material/Button";
import DialogActions from "@mui/material/DialogActions";
import Stack from "@mui/material/Stack";
import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

import { PrimaryActionButton } from "atoms/ui/PrimaryActionButton/PrimaryActionButton";
import { actionPendingMessages } from "config/actionPendingMessages";

type CategoryDialogActionsProps = {
  children?: ReactNode;
  disabled?: boolean;
  form?: string;
  onCancel: () => void;
  pending?: boolean;
  pendingLabel?: string;
  submitLabel: string;
};

export function CategoryDialogActions({
  children,
  disabled,
  form,
  onCancel,
  pending,
  pendingLabel = actionPendingMessages.save,
  submitLabel,
}: CategoryDialogActionsProps) {
  const formStatus = useFormStatus();
  const submitting = pending ?? formStatus.pending;
  return (
    <DialogActions disableSpacing sx={{ p: 3 }}>
      <Stack spacing={1.5} sx={{ width: "100%" }}>
        {children}
        <Stack direction="row" spacing={1.5} sx={{ width: "100%" }}>
          <Button fullWidth onClick={onCancel} type="button" variant="outlined">
            取消
          </Button>
          <PrimaryActionButton
            disabled={disabled}
            pending={submitting}
            pendingLabel={pendingLabel}
            form={form}
            fullWidth
            type="submit"
          >
            {submitLabel}
          </PrimaryActionButton>
        </Stack>
      </Stack>
    </DialogActions>
  );
}
