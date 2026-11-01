import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import { useId } from "react";

import { unsavedChangesMessages as m } from "config/unsavedChangesMessages";

export type UnsavedChangesDialogProps = {
  description?: string;
  onCancel: () => void;
  onDiscard: () => void;
  onSave: () => void;
  open: boolean;
  title?: string;
};

export function UnsavedChangesDialog({
  description = m.description,
  onCancel,
  onDiscard,
  onSave,
  open,
  title = m.title,
}: UnsavedChangesDialogProps) {
  const titleId = useId();
  return (
    <Dialog aria-labelledby={titleId} onClose={onCancel} open={open}>
      <DialogTitle id={titleId}>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{description}</DialogContentText>
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
