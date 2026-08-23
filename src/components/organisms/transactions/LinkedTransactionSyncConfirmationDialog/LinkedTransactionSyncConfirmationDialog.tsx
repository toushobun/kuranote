import SyncRoundedIcon from "@mui/icons-material/SyncRounded";
import Box from "@mui/material/Box";

import { ConfirmationDialog } from "molecules/ui/OperationFeedbackDialogs";

type LinkedTransactionSyncConfirmationDialogProps = {
  onCancel: () => void;
  onConfirm: () => void;
  open: boolean;
};

export function LinkedTransactionSyncConfirmationDialog({
  onCancel,
  onConfirm,
  open,
}: LinkedTransactionSyncConfirmationDialogProps) {
  return (
    <ConfirmationDialog
      cancelLabel="取消"
      confirmLabel="同步修改"
      description="该明细已有退款 / 报销绑定，是否同步修改关联数据？取消后不会写入任何修改。"
      illustration={
        <Box sx={illustrationSx}>
          <SyncRoundedIcon fontSize="large" />
        </Box>
      }
      onCancel={onCancel}
      onConfirm={onConfirm}
      open={open}
      title="同步修改关联数据？"
    />
  );
}

const illustrationSx = {
  alignItems: "center",
  bgcolor: "var(--user-theme-badge-bg)",
  borderRadius: "50%",
  color: "var(--user-theme-action-text)",
  display: "flex",
  height: 72,
  justifyContent: "center",
  width: 72,
};
