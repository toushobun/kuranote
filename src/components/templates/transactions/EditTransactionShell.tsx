"use client";

import { useActionState, useState, type ReactNode } from "react";

import Box from "@mui/material/Box";
import { EditTransactionActionButton } from "molecules/transactions/EditTransactionActionButton/EditTransactionActionButton";
import Stack from "@mui/material/Stack";

import { UnsavedChangesDialog } from "molecules/ui/UnsavedChangesDialog/UnsavedChangesDialog";
import { useUnsavedChangesGuard } from "molecules/ui/UnsavedChangesDialog/useUnsavedChangesGuard";

import { flowMessages } from "config/transactionStepFlowMessages";
import {
  transactionErrorCodes,
  transactionLinkedEditErrorTitles,
  type TransactionEditRestriction,
} from "internal/transaction";
import { TransactionEditRestrictionAlert } from "molecules/transactions/TransactionEditRestrictionAlert";
import {
  DeleteConfirmationDialog,
  FailureFeedbackDialog,
} from "molecules/ui/OperationFeedbackDialogs";
import { bottomNavigationLayout } from "organisms/navigation/bottomNavigationLayout";
import { EditTransactionDirtyProvider } from "organisms/transactions/EditTransactionDirtyContext/EditTransactionDirtyContext";
import { LinkedTransactionSyncConfirmationDialog } from "organisms/transactions/LinkedTransactionSyncConfirmationDialog/LinkedTransactionSyncConfirmationDialog";
import type {
  TransactionActionState,
  TransactionStateAction,
} from "types/transactions";
import { transactionEditRestrictionMessages } from "utils/transactionMessages";

import { TransactionPageTopBar } from "./TransactionPageTopBar";
import {
  useLinkedTransactionEditAction,
  type OriginalLinkedTarget,
} from "./useLinkedTransactionEditAction";

const deleteTransactionFormId = "delete-transaction-form";

type EditTransactionShellProps = {
  /** 保存编辑的 Server Action，与删除经同一个未保存守卫执行。 */
  action: TransactionStateAction;
  canDelete: boolean;
  /** 编辑表单（含自己的保存按钮），删除按钮显示在它下方。 */
  children: (edit: {
    formAction: (formData: FormData) => void;
    isPending: boolean;
    onValidationFailed: () => void;
  }) => ReactNode;
  deleteAction: TransactionStateAction;
  editRestriction: TransactionEditRestriction | null;
  hasLinkedIncomeItems: boolean;
  initialLinkedTargets?: OriginalLinkedTarget[];
  /** 离开确认里的「保存并退出」按这个 id 提交编辑表单。 */
  saveFormId: string;
  transactionRecordId: string;
};

/**
 * 编辑记账页（普通记录的小票、转账）的外框（#962）：顶栏、限制提示、删除、
 * 未保存离开确认、关联同步确认与保存 / 删除失败提示。
 * 只有表单经 useEditTransactionDirty 报告交易字段变化时才算未保存，
 * 商家搜索等抽屉里的输入不算。
 */
export function EditTransactionShell({
  action,
  canDelete,
  children,
  deleteAction,
  editRestriction,
  hasLinkedIncomeItems,
  initialLinkedTargets = [],
  saveFormId,
  transactionRecordId,
}: EditTransactionShellProps) {
  const readOnly = editRestriction !== null;
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const guard = useUnsavedChangesGuard({
    isDirty: hasUnsavedChanges && !readOnly,
    saveFormId,
  });
  const editAction = useLinkedTransactionEditAction(
    action,
    guard.runSaveAction,
    initialLinkedTargets,
  );
  const [deleteState, deleteFormAction] = useActionState(
    (state: TransactionActionState, data: FormData) =>
      guard.runAction(() => deleteAction(state, data)),
    {},
  );
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [dismissedDeleteState, setDismissedDeleteState] = useState(deleteState);

  function handleConfirmDelete() {
    const form = document.getElementById(deleteTransactionFormId);
    if (!(form instanceof HTMLFormElement)) return;

    setIsDeleteDialogOpen(false);
    form.requestSubmit();
  }

  return (
    <EditTransactionDirtyProvider onDirty={setHasUnsavedChanges}>
      <Stack spacing={0}>
        <TransactionPageTopBar
          title={
            readOnly
              ? transactionEditRestrictionMessages.pageTitle
              : flowMessages.editTitle
          }
        />
        {editRestriction ? (
          <Box sx={editRestrictionAlertSx}>
            <TransactionEditRestrictionAlert reason={editRestriction} />
          </Box>
        ) : null}
        {children({ ...editAction, onValidationFailed: guard.cancelSave })}
        {canDelete ? (
          <EditTransactionActionButton
            color="error"
            onClick={() => setIsDeleteDialogOpen(true)}
            variant="outlined"
            sx={{ mt: 1.5 }}
          >
            {flowMessages.delete}
          </EditTransactionActionButton>
        ) : null}
      </Stack>
      <form action={deleteFormAction} id={deleteTransactionFormId}>
        <input
          name="transactionRecordId"
          readOnly
          type="hidden"
          value={transactionRecordId}
        />
      </form>
      <UnsavedChangesDialog {...guard.dialogProps} />
      <DeleteConfirmationDialog
        description={
          hasLinkedIncomeItems
            ? "删除后这笔记账会从明细页移除，并解除退款 / 报销关联，目标支出的核销净额会相应变化。是否继续？"
            : "删除后这笔记账会从明细页移除，是否继续？"
        }
        onCancel={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        open={isDeleteDialogOpen}
        title="删除记账？"
      />
      <LinkedTransactionSyncConfirmationDialog
        description={editAction.retargetDescription ?? undefined}
        onCancel={() => {
          guard.cancelSave();
          editAction.cancelConfirmation();
        }}
        onConfirm={editAction.confirmSync}
        open={editAction.isConfirmationOpen}
      />
      <FailureFeedbackDialog
        bottomOffset={bottomNavigationLayout.feedbackBottomOffset}
        description={editAction.state.error}
        onClose={() => {
          editAction.closeFailure();
        }}
        open={editAction.isFailureOpen}
        title="保存失败"
      />
      <FailureFeedbackDialog
        bottomOffset={bottomNavigationLayout.feedbackBottomOffset}
        description={deleteState.error}
        onClose={() => setDismissedDeleteState(deleteState)}
        open={Boolean(
          deleteState.error && deleteState !== dismissedDeleteState,
        )}
        title={
          deleteState.errorCode === transactionErrorCodes.linkedDeleteForbidden
            ? transactionLinkedEditErrorTitles.deleteForbidden
            : "删除失败"
        }
      />
    </EditTransactionDirtyProvider>
  );
}

const editRestrictionAlertSx = {
  pb: 1.5,
};
