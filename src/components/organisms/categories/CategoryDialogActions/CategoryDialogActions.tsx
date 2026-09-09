import Button from "@mui/material/Button";
import DialogActions from "@mui/material/DialogActions";
import Stack from "@mui/material/Stack";
import type { ReactNode } from "react";

import { PrimaryActionButton } from "atoms/ui/PrimaryActionButton/PrimaryActionButton";

type CategoryDialogActionsProps = {
  children?: ReactNode;
  disabled?: boolean;
  form?: string;
  onCancel: () => void;
  submitLabel: string;
};

export function CategoryDialogActions({
  children,
  disabled,
  form,
  onCancel,
  submitLabel,
}: CategoryDialogActionsProps) {
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
