"use client";
import { ActionButton } from "atoms/ui/ActionButton/ActionButton";
import { actionPendingMessages } from "config/actionPendingMessages";
import { EditTransactionActionButton } from "molecules/transactions/EditTransactionActionButton/EditTransactionActionButton";

/** 小票下方的保存按钮：编辑页与下方的删除按钮同一样式。 */
export function ReceiptSubmitButton({
  edit,
  label,
  saving = false,
}: {
  edit: boolean;
  label: string;
  saving?: boolean;
}) {
  const SubmitButton = edit ? EditTransactionActionButton : ActionButton;
  return (
    <SubmitButton
      fullWidth
      size="large"
      variant="contained"
      type="submit"
      pending={saving}
      pendingLabel={actionPendingMessages.save}
    >
      {label}
    </SubmitButton>
  );
}
