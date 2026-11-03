"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import {
  BackLayerScope,
  transactionBackLayerLevels,
} from "molecules/ui/UnsavedChangesDialog/BackLayerScope";
import { useDirtySnapshot } from "molecules/ui/UnsavedChangesDialog/useDirtySnapshot";
import { useUnsavedChangesGuard } from "molecules/ui/UnsavedChangesDialog/useUnsavedChangesGuard";
import { UnsavedChangesDialog } from "molecules/ui/UnsavedChangesDialog/UnsavedChangesDialog";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { PrimaryActionButton } from "atoms/ui/PrimaryActionButton/PrimaryActionButton";
import { ReadOnlyFieldset } from "atoms/ui/ReadOnlyFieldset";
import { balanceAdjustmentText as text } from "config/balanceAdjustmentText";
import { routePaths } from "config/paths";
import {
  balanceAdjustmentErrorMessages,
  type BalanceAdjustmentEditInitialValues,
  type TransactionEditRestriction,
} from "internal/transaction";
import { TransactionDateTimePicker } from "molecules/transactions/TransactionDateTimePicker";
import { TransactionEditRestrictionAlert } from "molecules/transactions/TransactionEditRestrictionAlert";
import { ActionFailureFeedback } from "molecules/ui/OperationFeedbackDialogs";
import { useConfirmDialog } from "providers/ConfirmDialogProvider/ConfirmDialogProvider";
import type { TransactionStateAction } from "types/transactions";
import {
  composeTransactionDateTimeLocalValue,
  formatDateTimeLocalInputValue,
  formatTransactionRowAmount,
  splitDateTimeLocalValue,
} from "utils/transactions";

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
  const [dirty, setDirty] = useState(false);
  const [, startTransition] = useTransition();
  const confirm = useConfirmDialog();
  const [transactionDate, setTransactionDate] = useState("");
  const [transactionTime, setTransactionTime] = useState("");
  const [offset, setOffset] = useState("");
  useEffect(() => {
    // 客户端挂载后按本地时区还原交易时间，避免水合差异。
    const localValue = formatDateTimeLocalInputValue(
      initialValues.transactionAt,
    );
    const nextDateTime = splitDateTimeLocalValue(localValue);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTransactionDate(nextDateTime.date);
    setTransactionTime(nextDateTime.time);
    setOffset(String(new Date().getTimezoneOffset()));
  }, [initialValues.transactionAt]);
  const transactionAtValue = composeTransactionDateTimeLocalValue(
    transactionDate,
    transactionTime,
  );
  useDirtySnapshot(
    JSON.stringify([note, transactionAtValue]),
    setDirty,
    Boolean(transactionAtValue),
  );
  const guard = useUnsavedChangesGuard({
    isDirty: dirty && !readOnly,
    saveFormId: formId,
  });
  const [state, submit, pending] = useActionState(
    (previous: Awaited<ReturnType<TransactionStateAction>>, data: FormData) =>
      guard.runAction(() => action(previous, data)),
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
  return (
    <BackLayerScope level={transactionBackLayerLevels.pageOverlay}>
      <Stack spacing={2} sx={{ p: 2 }}>
        <Typography variant="h5">{text.title}</Typography>
        {editRestriction ? (
          <TransactionEditRestrictionAlert reason={editRestriction} />
        ) : null}
        {initialValues.accountArchived ? (
          <Alert severity="info">
            {balanceAdjustmentErrorMessages.archivedAccount}
          </Alert>
        ) : null}
        <form id={formId} action={submit}>
          <ReadOnlyFieldset readOnly={readOnly}>
            <Stack spacing={2}>
              <input
                type="hidden"
                name="transactionRecordId"
                value={initialValues.transactionRecordId}
              />
              <input
                type="hidden"
                name="timeZoneOffsetMinutes"
                value={offset}
              />
              <TextField
                label={text.account}
                value={initialValues.accountName}
                slotProps={{ input: { readOnly: true } }}
              />
              <TextField
                label={text.amount}
                value={formatTransactionRowAmount(
                  "balance_adjustment",
                  initialValues.signedDelta,
                  initialValues.currency,
                )}
                slotProps={{ input: { readOnly: true } }}
              />
              <input
                type="hidden"
                name="transactionAt"
                value={transactionAtValue}
              />
              <TransactionDateTimePicker
                date={transactionDate}
                fieldLabel={text.time}
                onDateChange={setTransactionDate}
                onTimeChange={setTransactionTime}
                time={transactionTime}
              />
              <TextField
                label={text.note}
                multiline
                name="note"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                slotProps={{ htmlInput: { maxLength: 2000 } }}
              />
              {readOnly ? null : (
                <PrimaryActionButton
                  type="submit"
                  disabled={pending || deleting || !transactionAtValue}
                >
                  {text.save}
                </PrimaryActionButton>
              )}
            </Stack>
          </ReadOnlyFieldset>
        </form>
        {canDelete ? (
          <Button
            color="error"
            onClick={requestDelete}
            disabled={initialValues.accountArchived || pending || deleting}
          >
            {text.remove}
          </Button>
        ) : null}
        <Button component={Link} href={routePaths.transactions}>
          {text.cancel}
        </Button>
        <ActionFailureFeedback state={failure} title={text.failureTitle} />
        <UnsavedChangesDialog {...guard.dialogProps} />
      </Stack>
    </BackLayerScope>
  );
}
