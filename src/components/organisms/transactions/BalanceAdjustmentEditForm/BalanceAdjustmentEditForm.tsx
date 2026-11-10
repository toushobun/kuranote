"use client";

import { useActionState, useState, useTransition, type FormEvent } from "react";
import {
  BackLayerScope,
  transactionBackLayerLevels,
} from "molecules/ui/UnsavedChangesDialog/BackLayerScope";
import { useDirtySnapshot } from "molecules/ui/UnsavedChangesDialog/useDirtySnapshot";
import { useUnsavedChangesGuard } from "molecules/ui/UnsavedChangesDialog/useUnsavedChangesGuard";
import { UnsavedChangesDialog } from "molecules/ui/UnsavedChangesDialog/UnsavedChangesDialog";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { AccountAvatar } from "atoms/accounts/AccountAvatar/AccountAvatar";
import { balanceAdjustmentText as text } from "config/balanceAdjustmentText";
import {
  balanceAdjustmentErrorMessages,
  type BalanceAdjustmentEditInitialValues,
  type TransactionEditRestriction,
} from "internal/transaction";
import { EditTransactionActionButton } from "molecules/transactions/EditTransactionActionButton/EditTransactionActionButton";
import { TransactionEditRestrictionAlert } from "molecules/transactions/TransactionEditRestrictionAlert";
import { ActionFailureFeedback } from "molecules/ui/OperationFeedbackDialogs";
import { ReceiptAmountRow } from "organisms/transactions/ReceiptParts/ReceiptAmountRow";
import { ReceiptNoteSection } from "organisms/transactions/ReceiptParts/ReceiptNoteSection";
import { ReceiptPaper } from "organisms/transactions/ReceiptParts/ReceiptPaper";
import { ReceiptSubmitButton } from "organisms/transactions/ReceiptParts/ReceiptSubmitButton";
import { ReceiptTimeButton } from "organisms/transactions/ReceiptParts/ReceiptTimeButton";
import { useLocalTransactionDateTime } from "organisms/transactions/ReceiptParts/useLocalTransactionDateTime";
import { useConfirmDialog } from "providers/ConfirmDialogProvider/ConfirmDialogProvider";
import { TransactionPageTopBar } from "templates/transactions/TransactionPageTopBar";
import type { TransactionStateAction } from "types/transactions";

import {
  expenseAmountColor,
  incomeAmountColor,
} from "../TransactionConfirmStep/ReceiptLine";
import { formatStepCurrencyAmount } from "../transactionStepFlowFormat";

/**
 * 编辑余额调整（#1050 小票风格）：账户与调整金额不能改，只能改时间和备注；
 * 有限制时显示只读小票（#928）。
 */
export function BalanceAdjustmentEditForm({
  initialValues,
  action,
  canDelete,
  deleteAction,
  editRestriction,
}: {
  initialValues: BalanceAdjustmentEditInitialValues;
  action: TransactionStateAction;
  canDelete: boolean;
  deleteAction: TransactionStateAction;
  /** 有限制时显示只读详情（#928）。 */
  editRestriction: TransactionEditRestriction | null;
}) {
  const readOnly = editRestriction !== null;
  const formId = "edit-balance-adjustment-form";
  const [note, setNote] = useState(initialValues.note);
  const [timeOpen, setTimeOpen] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [, startTransition] = useTransition();
  const confirm = useConfirmDialog();
  const dateTime = useLocalTransactionDateTime(initialValues.transactionAt);
  useDirtySnapshot(
    JSON.stringify([note, dateTime.transactionAtValue]),
    setDirty,
    Boolean(dateTime.transactionAtValue),
  );
  const guard = useUnsavedChangesGuard({
    isDirty: dirty && !readOnly,
    saveFormId: formId,
  });
  const [state, submit, pending] = useActionState(
    (previous: Awaited<ReturnType<TransactionStateAction>>, data: FormData) =>
      guard.runSaveAction(data, (values) => action(previous, values)),
    {},
  );
  const [deleteState, remove, deleting] = useActionState(
    (previous: Awaited<ReturnType<TransactionStateAction>>, data: FormData) =>
      guard.runAction(() => deleteAction(previous, data)),
    {},
  );
  const failure = deleteState.error ? deleteState : state;
  async function requestDelete() {
    if (
      !(await confirm({
        title: text.deleteTitle,
        description: text.deleteDescription,
        confirmLabel: text.remove,
        tone: "delete",
      }))
    )
      return;
    const form = new FormData();
    form.set("transactionRecordId", initialValues.transactionRecordId);
    startTransition(() => remove(form));
  }
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    // 本地时间还原前不提交。
    if (dateTime.transactionAtValue) return;
    event.preventDefault();
    guard.cancelSave();
  }
  const delta = Number(initialValues.signedDelta);
  const increase = delta >= 0;
  // 增减颜色跟随用户主题的收支配色，标签与金额一致。
  const amountColor = increase ? incomeAmountColor : expenseAmountColor;
  const amount = `${increase ? "+" : "-"}${formatStepCurrencyAmount(
    String(Math.abs(delta)),
    initialValues.currency,
  )}`;
  return (
    <BackLayerScope level={transactionBackLayerLevels.receiptEditor}>
      <Stack spacing={0}>
        <TransactionPageTopBar title={text.title} />
        {editRestriction ? (
          <Box sx={alertSx}>
            <TransactionEditRestrictionAlert reason={editRestriction} />
          </Box>
        ) : null}
        {initialValues.accountArchived ? (
          <Alert severity="info" sx={alertSx}>
            {balanceAdjustmentErrorMessages.archivedAccount}
          </Alert>
        ) : null}
        <Box
          component="form"
          id={formId}
          action={submit}
          onSubmit={handleSubmit}
        >
          <input
            type="hidden"
            name="transactionRecordId"
            value={initialValues.transactionRecordId}
          />
          <input
            type="hidden"
            name="timeZoneOffsetMinutes"
            value={dateTime.timeZoneOffsetMinutes}
          />
          <input
            type="hidden"
            name="transactionAt"
            value={dateTime.transactionAtValue}
          />
          <input type="hidden" name="note" value={note} />
          <Stack spacing={2}>
            <ReceiptPaper>
              <Stack spacing={0.5} sx={{ alignItems: "center", pb: 1.5 }}>
                <AccountAvatar
                  id={initialValues.accountId}
                  name={initialValues.accountName}
                  size={48}
                />
                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                  {initialValues.accountName}
                </Typography>
                <Chip
                  size="small"
                  variant="outlined"
                  label={increase ? text.increaseTag : text.decreaseTag}
                  sx={{ borderColor: amountColor, color: amountColor }}
                />
                <ReceiptTimeButton
                  date={dateTime.date}
                  time={dateTime.time}
                  onDateChange={dateTime.setDate}
                  onTimeChange={dateTime.setTime}
                  open={timeOpen}
                  onOpenChange={setTimeOpen}
                  readOnly={readOnly}
                />
              </Stack>
              <ReceiptAmountRow
                label={text.amount}
                amount={amount}
                color={amountColor}
              />
              <ReceiptNoteSection
                note={note}
                onChange={(event) => setNote(event.target.value)}
                readOnly={readOnly}
              />
            </ReceiptPaper>
            {readOnly ? null : (
              <ReceiptSubmitButton edit label={text.save} saving={pending} />
            )}
          </Stack>
        </Box>
        {canDelete ? (
          <EditTransactionActionButton
            color="error"
            onClick={requestDelete}
            disabled={initialValues.accountArchived || pending || deleting}
            variant="outlined"
            sx={{ mt: 1.5 }}
          >
            {text.remove}
          </EditTransactionActionButton>
        ) : null}
        <ActionFailureFeedback state={failure} title={text.failureTitle} />
        <UnsavedChangesDialog {...guard.dialogProps} />
      </Stack>
    </BackLayerScope>
  );
}

const alertSx = { mb: 2 };
