"use client";
import Button from "@mui/material/Button";

import { flowMessages as m } from "config/transactionStepFlowMessages";
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
  const SubmitButton = edit ? EditTransactionActionButton : Button;
  return (
    <SubmitButton
      fullWidth
      size="large"
      variant="contained"
      type="submit"
      loading={saving}
      disabled={saving}
    >
      {saving ? m.saving : label}
    </SubmitButton>
  );
}
