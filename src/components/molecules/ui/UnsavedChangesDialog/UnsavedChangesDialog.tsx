import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import { useId, useLayoutEffect, useRef } from "react";

import { unsavedChangesMessages as m } from "config/unsavedChangesMessages";

export type UnsavedChangesDialogProps = {
  onCancel: () => void;
  onDiscard: () => void;
  onSave: () => void;
  open: boolean;
};

export function UnsavedChangesDialog({
  onCancel,
  onDiscard,
  onSave,
  open,
}: UnsavedChangesDialogProps) {
  const titleId = useId();
  const previousFocus = useRef<HTMLElement | null>(null);
  useLayoutEffect(() => {
    if (open)
      previousFocus.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
  }, [open]);
  return (
    <Dialog
      aria-labelledby={titleId}
      disableRestoreFocus
      onClose={onCancel}
      open={open}
      slotProps={{
        transition: {
          onExited: () => {
            // 保留键盘焦点返回，但不让屏幕外的原触发元素把长页重新滚回上方。
            if (previousFocus.current?.isConnected)
              previousFocus.current.focus({ preventScroll: true });
          },
        },
      }}
    >
      <DialogTitle id={titleId}>{m.title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{m.description}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>{m.continueEditing}</Button>
        <Button onClick={onDiscard} color="error">
          {m.discard}
        </Button>
        <Button onClick={onSave} variant="contained">
          {m.save}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
