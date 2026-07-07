import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Link from "next/link";

export type UnsavedChangesDialogProps = {
  description?: string;
  discardHref?: string;
  onCancel: () => void;
  onDiscard?: () => void;
  onSave: () => void;
  open: boolean;
  title?: string;
};

export function UnsavedChangesDialog({
  description = "修正的内容尚未保存，是否保存？",
  discardHref,
  onCancel,
  onDiscard,
  onSave,
  open,
  title = "尚未保存",
}: UnsavedChangesDialogProps) {
  return (
    <Dialog
      aria-labelledby="unsaved-changes-dialog-title"
      onClose={onCancel}
      open={open}
    >
      <DialogTitle id="unsaved-changes-dialog-title">{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{description}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>继续编辑</Button>
        {discardHref ? (
          <Button component={Link} href={discardHref} color="error">
            放弃修改
          </Button>
        ) : (
          <Button onClick={onDiscard} color="error">
            放弃修改
          </Button>
        )}
        <Button onClick={onSave} variant="contained">
          保存
        </Button>
      </DialogActions>
    </Dialog>
  );
}
