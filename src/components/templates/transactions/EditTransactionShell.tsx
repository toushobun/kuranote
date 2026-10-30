"use client";

import {
  useActionState,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Stack from "@mui/material/Stack";
import Link from "next/link";

import { routePaths } from "config/paths";
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
import { designTokens } from "theme/theme";
import type { TransactionStateAction } from "types/transactions";
import { transactionEditRestrictionMessages } from "utils/transactionMessages";

import { TransactionPageTopBar } from "./TransactionPageTopBar";
import type { useLinkedTransactionEditAction } from "./useLinkedTransactionEditAction";

const deleteTransactionFormId = "delete-transaction-form";

type EditTransactionShellProps = {
  canDelete: boolean;
  /** 编辑表单（含自己的保存按钮），删除按钮显示在它下方。 */
  children: ReactNode;
  deleteAction: TransactionStateAction;
  editAction: ReturnType<typeof useLinkedTransactionEditAction>;
  editRestriction: TransactionEditRestriction | null;
  hasLinkedIncomeItems: boolean;
  /** 离开确认里的「保存」按这个 id 提交编辑表单。 */
  saveFormId: string;
  transactionRecordId: string;
};

/**
 * 编辑记账页（普通记录的小票、转账）的外框（#962）：顶栏、限制提示、删除、
 * 未保存离开确认、关联同步确认与保存 / 删除失败提示。
 */
export function EditTransactionShell({
  canDelete,
  children,
  deleteAction,
  editAction,
  editRestriction,
  hasLinkedIncomeItems,
  saveFormId,
  transactionRecordId,
}: EditTransactionShellProps) {
  const readOnly = editRestriction !== null;
  const [deleteState, deleteFormAction] = useActionState(deleteAction, {});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isExitDialogOpen, setIsExitDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [dismissedDeleteState, setDismissedDeleteState] = useState(deleteState);

  const markDirty = useCallback(() => setHasUnsavedChanges(true), []);

  useEffect(() => {
    if (!hasUnsavedChanges) return;

    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  function handleSaveAndExit() {
    const form = document.getElementById(saveFormId);
    if (!(form instanceof HTMLFormElement)) return;

    setIsExitDialogOpen(false);
    form.requestSubmit();
  }

  function handleConfirmDelete() {
    const form = document.getElementById(deleteTransactionFormId);
    if (!(form instanceof HTMLFormElement)) return;

    setIsDeleteDialogOpen(false);
    form.requestSubmit();
  }

  return (
    <EditTransactionDirtyProvider onDirty={markDirty}>
      <Stack onChangeCapture={markDirty} spacing={0}>
        <TransactionPageTopBar
          hasUnsavedChanges={hasUnsavedChanges}
          onClose={() => setIsExitDialogOpen(true)}
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
        {children}
        {canDelete ? (
          <Button
            color="error"
            fullWidth
            onClick={() => setIsDeleteDialogOpen(true)}
            size="large"
            variant="outlined"
            sx={editTransactionDeleteButtonSx}
          >
            {flowMessages.delete}
          </Button>
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
      <Dialog
        aria-labelledby="unsaved-transaction-dialog-title"
        onClose={() => setIsExitDialogOpen(false)}
        open={isExitDialogOpen}
      >
        <DialogTitle id="unsaved-transaction-dialog-title">
          尚未保存
        </DialogTitle>
        <DialogContent>
          <DialogContentText>修正的内容尚未保存，是否保存？</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsExitDialogOpen(false)}>继续编辑</Button>
          <Button component={Link} href={routePaths.transactions} color="error">
            放弃修改
          </Button>
          <Button onClick={handleSaveAndExit} variant="contained">
            保存
          </Button>
        </DialogActions>
      </Dialog>
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
        onCancel={() => {
          setHasUnsavedChanges(true);
          editAction.cancelConfirmation();
        }}
        onConfirm={editAction.confirmSync}
        open={editAction.isConfirmationOpen}
      />
      <FailureFeedbackDialog
        bottomOffset={bottomNavigationLayout.feedbackBottomOffset}
        description={editAction.state.error}
        onClose={() => {
          setHasUnsavedChanges(true);
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

const editTransactionDeleteButtonSx = {
  borderRadius: `${designTokens.radius.md}px`,
  fontSize: "1rem",
  fontWeight: 800,
  minHeight: 48,
  mt: 1.5,
};
