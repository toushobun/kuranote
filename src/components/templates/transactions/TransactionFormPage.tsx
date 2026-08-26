"use client";

import {
  useCallback,
  useActionState,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Link from "next/link";

import { routePaths } from "config/paths";
import {
  DeleteConfirmationDialog,
  FailureFeedbackDialog,
} from "molecules/ui/OperationFeedbackDialogs";
import { ErrorState } from "molecules/ui/ErrorState";
import { bottomNavigationLayout } from "organisms/navigation/bottomNavigationLayout";
import { transactionErrorCodes } from "internal/transaction";
import {
  TransactionTypeNavigation,
  type TransactionTypeNavigationValue,
} from "molecules/transactions/TransactionTypeNavigation";
import { TransactionAmountKeypadLauncher } from "organisms/transactions/TransactionAmountKeypadLauncher/TransactionAmountKeypadLauncher";
import { EditTransactionDirtyProvider } from "organisms/transactions/EditTransactionDirtyContext/EditTransactionDirtyContext";
import { LinkedTransactionSyncConfirmationDialog } from "organisms/transactions/LinkedTransactionSyncConfirmationDialog/LinkedTransactionSyncConfirmationDialog";
import {
  TransactionForm,
  type TransactionFormInitialValues,
} from "organisms/transactions/TransactionForm/TransactionForm";
import { transactionSubmitButtonSx } from "organisms/transactions/TransactionForm/TransactionForm.styles";
import { TransferTransactionForm } from "organisms/transactions/TransferTransactionForm/TransferTransactionForm";
import type { TransferEditInitialValues } from "types/transactions";
import type {
  TransactionAccountOption,
  TransactionCategoryOption,
  TransactionMerchantOption,
  TransactionGroupPage,
  TransactionMonthPage,
  TransactionSearchPage,
  TransactionTimeGroupViewData,
  TransactionRecordType,
  TransactionStateAction,
  TransactionType,
} from "types/transactions";
import { useLinkedTransactionEditAction } from "./useLinkedTransactionEditAction";

export type TransactionFormTemplateProps = {
  accountOptions: TransactionAccountOption[];
  action: TransactionStateAction;
  categoryOptions: TransactionCategoryOption[];
  errorMessage: string | null;
  frequentCategoryIds: string[];
  initialType?: TransactionRecordType;
  ledgerName: string;
  merchantOptions: TransactionMerchantOption[];
  refundPickerView?: TransactionTimeGroupViewData;
  loadRefundGroupItemsAction?: (
    groupKey: string,
    offset: number,
  ) => Promise<TransactionMonthPage>;
  loadRefundMoreGroupsAction?: (
    offset: number,
  ) => Promise<TransactionGroupPage>;
  loadRefundSearchPageAction?: (
    query: string,
    offset: number,
  ) => Promise<TransactionSearchPage>;
  transactionItemSpecialStatusEnabled: boolean;
};

type EditTransactionTemplateProps = Omit<
  TransactionFormTemplateProps,
  "initialType"
> & {
  deleteAction: TransactionStateAction;
  initialValues: TransactionFormInitialValues;
};

type EditTransferTransactionTemplateProps = Omit<
  TransactionFormTemplateProps,
  "initialType"
> & {
  deleteAction: TransactionStateAction;
  initialValues: TransferEditInitialValues;
};

const transactionTypeOrder: readonly TransactionRecordType[] = [
  "expense",
  "income",
  "transfer",
];

const deleteTransactionFormId = "delete-transaction-form";

function editTransactionFormId(type: TransactionRecordType) {
  return `edit-${type}-transaction-form`;
}

function requireEditTransactionRecordId(
  transactionRecordId: string | undefined,
) {
  if (!transactionRecordId) {
    throw new Error("transactionRecordId is required for edit transaction.");
  }

  return transactionRecordId;
}

type TransactionTypeSlidePanelsProps = {
  activeType: TransactionRecordType;
  panels: Record<TransactionRecordType, ReactNode>;
};

function TransactionTypeSlidePanels({
  activeType,
  panels,
}: TransactionTypeSlidePanelsProps) {
  const expensePanelRef = useRef<HTMLDivElement>(null);
  const incomePanelRef = useRef<HTMLDivElement>(null);
  const transferPanelRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState<number | null>(null);
  const activeIndex = transactionTypeOrder.indexOf(activeType);

  useLayoutEffect(() => {
    function getActivePanel() {
      if (activeType === "expense") return expensePanelRef.current;
      if (activeType === "income") return incomePanelRef.current;
      return transferPanelRef.current;
    }

    const activePanel = getActivePanel();
    if (!activePanel) return;

    function updateContainerHeight() {
      const currentPanel = getActivePanel();
      if (!currentPanel) return;

      setContainerHeight(currentPanel.getBoundingClientRect().height);
    }

    updateContainerHeight();

    if (typeof ResizeObserver === "undefined") return;

    const resizeObserver = new ResizeObserver(updateContainerHeight);
    resizeObserver.observe(activePanel);

    return () => {
      resizeObserver.disconnect();
    };
  }, [activeType]);

  return (
    <Box
      data-testid="transaction-type-slide-panels"
      sx={(theme) => ({
        height: containerHeight ?? "auto",
        overflow: "hidden",
        transition: theme.transitions.create("height", {
          duration: theme.transitions.duration.shorter,
          easing: theme.transitions.easing.easeInOut,
        }),
        width: "100%",
      })}
    >
      <Box
        sx={(theme) => ({
          alignItems: "flex-start",
          display: "flex",
          transform: `translateX(-${activeIndex * 100}%)`,
          transition: theme.transitions.create("transform", {
            duration: theme.transitions.duration.shorter,
            easing: theme.transitions.easing.easeInOut,
          }),
          width: "100%",
        })}
      >
        {transactionTypeOrder.map((type) => (
          <Box
            key={type}
            ref={
              type === "expense"
                ? expensePanelRef
                : type === "income"
                  ? incomePanelRef
                  : transferPanelRef
            }
            aria-hidden={type !== activeType}
            data-testid={`transaction-type-slide-panel-${type}`}
            inert={type !== activeType ? true : undefined}
            sx={{ flex: "0 0 100%" }}
          >
            {panels[type]}
          </Box>
        ))}
      </Box>
    </Box>
  );
}

export function NewTransactionTemplate(props: TransactionFormTemplateProps) {
  return (
    <>
      <NewTransactionFormView {...props} />
      <TransactionAmountKeypadLauncher />
    </>
  );
}

export function TransactionPermissionDenied({
  operation,
  reason = "permission",
}: {
  operation: "edit" | "create";
  reason?: "archivedAccount" | "linked" | "permission";
}) {
  const operationLabel = operation === "create" ? "新增" : "编辑";
  const isLinked = operation === "edit" && reason === "linked";
  const hasArchivedAccount =
    operation === "edit" && reason === "archivedAccount";

  return (
    <Stack spacing={2}>
      <TransactionPageTopBar title={`${operationLabel}记账`} />
      <ErrorState
        title={
          hasArchivedAccount
            ? "该交易不能编辑"
            : isLinked
              ? "该交易不能编辑"
              : `无法${operationLabel}记账`
        }
        description={
          hasArchivedAccount
            ? "该交易引用的账户已被删除，请先恢复该账户后再编辑。"
            : isLinked
              ? "该交易已关联报销或退款，不能编辑。"
              : `当前账本角色没有${operationLabel}记账的权限。`
        }
        action={
          <Button
            component={Link}
            href={routePaths.transactions}
            variant="outlined"
          >
            返回明细
          </Button>
        }
      />
    </Stack>
  );
}

function NewTransactionFormView({
  accountOptions,
  action,
  categoryOptions,
  errorMessage,
  frequentCategoryIds,
  initialType,
  merchantOptions,
  refundPickerView,
  loadRefundGroupItemsAction,
  loadRefundMoreGroupsAction,
  loadRefundSearchPageAction,
  transactionItemSpecialStatusEnabled,
}: TransactionFormTemplateProps) {
  const [actionState, formAction] = useActionState(action, {});
  const activeErrorMessage = actionState.error ?? errorMessage;
  const [activeType, setActiveType] = useState<TransactionRecordType>(
    initialType ?? "expense",
  );
  const lastNormalTypeRef = useRef<TransactionType>(
    initialType === "income" ? "income" : "expense",
  );
  const [, setSubmitDisabledByType] = useState<
    Record<TransactionRecordType, boolean>
  >({ expense: true, income: true, transfer: true });

  useEffect(() => {
    if (activeType !== "transfer") {
      lastNormalTypeRef.current = activeType;
    }
  }, [activeType]);

  function handleNewTypeChange(type: TransactionTypeNavigationValue) {
    if (type === "normal") {
      setActiveType(lastNormalTypeRef.current);
      return;
    }

    setActiveType("transfer");
  }

  const panels = useMemo(
    () => ({
      expense: (
        <TransactionForm
          action={formAction}
          accountOptions={accountOptions}
          categoryOptions={categoryOptions}
          errorMessage={activeErrorMessage}
          frequentCategoryIds={frequentCategoryIds}
          formId="new-expense-transaction-form"
          hideHeader
          initialType="expense"
          merchantOptions={merchantOptions}
          refundPickerView={refundPickerView}
          loadRefundGroupItemsAction={loadRefundGroupItemsAction}
          loadRefundMoreGroupsAction={loadRefundMoreGroupsAction}
          loadRefundSearchPageAction={loadRefundSearchPageAction}
          transactionItemSpecialStatusEnabled={
            transactionItemSpecialStatusEnabled
          }
          onSubmitDisabledChange={(disabled) =>
            setSubmitDisabledByType((prev) => ({ ...prev, expense: disabled }))
          }
        />
      ),
      income: (
        <TransactionForm
          action={formAction}
          accountOptions={accountOptions}
          categoryOptions={categoryOptions}
          errorMessage={activeErrorMessage}
          frequentCategoryIds={frequentCategoryIds}
          formId="new-income-transaction-form"
          hideHeader
          initialType="income"
          merchantOptions={merchantOptions}
          refundPickerView={refundPickerView}
          loadRefundGroupItemsAction={loadRefundGroupItemsAction}
          loadRefundMoreGroupsAction={loadRefundMoreGroupsAction}
          loadRefundSearchPageAction={loadRefundSearchPageAction}
          transactionItemSpecialStatusEnabled={
            transactionItemSpecialStatusEnabled
          }
          onSubmitDisabledChange={(disabled) =>
            setSubmitDisabledByType((prev) => ({ ...prev, income: disabled }))
          }
        />
      ),
      transfer: (
        <TransferTransactionForm
          action={formAction}
          accountOptions={accountOptions}
          errorMessage={activeErrorMessage}
          formId="new-transfer-transaction-form"
          hideHeader
          onSubmitDisabledChange={(disabled) =>
            setSubmitDisabledByType((prev) => ({ ...prev, transfer: disabled }))
          }
        />
      ),
    }),
    [
      formAction,
      accountOptions,
      categoryOptions,
      frequentCategoryIds,
      activeErrorMessage,
      merchantOptions,
      refundPickerView,
      loadRefundGroupItemsAction,
      loadRefundMoreGroupsAction,
      loadRefundSearchPageAction,
      transactionItemSpecialStatusEnabled,
    ],
  );

  return (
    <Stack spacing={0}>
      <TransactionPageTopBar title="记一笔" />
      <TransactionTypeNavigation
        activeType={activeType === "transfer" ? "transfer" : "normal"}
        onChange={handleNewTypeChange}
      />
      <TransactionTypeSlidePanels activeType={activeType} panels={panels} />
    </Stack>
  );
}

function TransactionPageTopBar({
  hasUnsavedChanges = false,
  onClose,
  title,
}: {
  hasUnsavedChanges?: boolean;
  onClose?: () => void;
  title: string;
}) {
  return (
    <Box sx={newTransactionTopBarSx}>
      {hasUnsavedChanges && onClose ? (
        <IconButton
          aria-label="关闭"
          onClick={onClose}
          sx={newTransactionCloseButtonSx}
        >
          <ArrowBackRoundedIcon />
        </IconButton>
      ) : (
        <IconButton
          aria-label="关闭"
          component={Link}
          href={routePaths.transactions}
          sx={newTransactionCloseButtonSx}
        >
          <ArrowBackRoundedIcon />
        </IconButton>
      )}
      <Typography component="h1" variant="h5" sx={newTransactionTitleSx}>
        {title}
      </Typography>
      <Box aria-hidden sx={{ width: 40 }} />
    </Box>
  );
}

const saveFeedbackBottomOffset = `calc(${bottomNavigationLayout.shellPaddingBottom} + 8px)`;

const newTransactionTopBarSx = {
  alignItems: "center",
  display: "grid",
  gridTemplateColumns: "40px minmax(0, 1fr) 40px",
  pb: 1.5,
  pt: { xs: 0, sm: 0.5 },
};

const newTransactionCloseButtonSx = {
  color: "text.secondary",
  justifySelf: "start",
  "&:hover": {
    bgcolor: "action.hover",
  },
};

const newTransactionTitleSx = {
  color: "text.primary",
  fontSize: "1rem",
  fontWeight: 800,
  letterSpacing: 0,
  lineHeight: 1.25,
  textAlign: "center",
};

type EditTransactionShellProps = {
  activeType: TransactionRecordType;
  deleteAction: TransactionStateAction;
  hasLinkedIncomeItems: boolean;
  isSaveConfirmationOpen: boolean;
  isSaveFailureOpen: boolean;
  isSavePending: boolean;
  onCancelSync: () => void;
  onCloseSaveFailure: () => void;
  onConfirmSync: () => void;
  panels: Record<TransactionRecordType, ReactNode>;
  saveErrorMessage?: string;
  setActiveType: (type: TransactionRecordType) => void;
  submitDisabledByType: Record<TransactionRecordType, boolean>;
  transactionRecordId: string;
};

function EditTransactionShell({
  activeType,
  deleteAction,
  hasLinkedIncomeItems,
  isSaveConfirmationOpen,
  isSaveFailureOpen,
  isSavePending,
  onCancelSync,
  onCloseSaveFailure,
  onConfirmSync,
  panels,
  saveErrorMessage,
  setActiveType,
  submitDisabledByType,
  transactionRecordId,
}: EditTransactionShellProps) {
  const [deleteState, deleteFormAction] = useActionState(deleteAction, {});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isExitDialogOpen, setIsExitDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [dismissedDeleteState, setDismissedDeleteState] = useState(deleteState);
  const lastNormalTypeRef = useRef<TransactionType>(
    activeType !== "transfer" ? activeType : "expense",
  );

  const outerTab: TransactionTypeNavigationValue =
    activeType === "transfer" ? "transfer" : "normal";

  const markDirty = useCallback(() => setHasUnsavedChanges(true), []);

  useEffect(() => {
    if (activeType !== "transfer") {
      lastNormalTypeRef.current = activeType;
    }
  }, [activeType]);

  useEffect(() => {
    if (!hasUnsavedChanges) return;

    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  function handleOuterTabChange(tab: TransactionTypeNavigationValue) {
    markDirty();
    setActiveType(tab === "transfer" ? "transfer" : lastNormalTypeRef.current);
  }

  function handleSaveAndExit() {
    const form = document
      .getElementById(editTransactionFormId(activeType))
      ?.closest("form");

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
          title="编辑记账"
        />
        <TransactionTypeNavigation
          activeType={outerTab}
          onChange={handleOuterTabChange}
        />
        <TransactionTypeSlidePanels activeType={activeType} panels={panels} />
        <Box sx={editTransactionActionBarSx}>
          <Button
            color="error"
            onClick={() => setIsDeleteDialogOpen(true)}
            size="large"
            variant="outlined"
            sx={editTransactionDeleteButtonSx}
          >
            删除
          </Button>
          <Button
            disabled={submitDisabledByType[activeType] || isSavePending}
            form={editTransactionFormId(activeType)}
            size="large"
            type="submit"
            variant="contained"
            sx={transactionSubmitButtonSx}
          >
            保存修改
          </Button>
        </Box>
      </Stack>
      <form action={deleteFormAction} id={deleteTransactionFormId}>
        <input
          name="transactionRecordId"
          readOnly
          type="hidden"
          value={transactionRecordId}
        />
      </form>
      <TransactionAmountKeypadLauncher />
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
          onCancelSync();
        }}
        onConfirm={onConfirmSync}
        open={isSaveConfirmationOpen}
      />
      <FailureFeedbackDialog
        bottomOffset={saveFeedbackBottomOffset}
        description={saveErrorMessage}
        onClose={() => {
          setHasUnsavedChanges(true);
          onCloseSaveFailure();
        }}
        open={isSaveFailureOpen}
        title="保存失败"
      />
      <FailureFeedbackDialog
        bottomOffset={saveFeedbackBottomOffset}
        description={deleteState.error}
        onClose={() => setDismissedDeleteState(deleteState)}
        open={Boolean(
          deleteState.error && deleteState !== dismissedDeleteState,
        )}
        title={
          deleteState.errorKey === transactionErrorCodes.linkedDeleteForbidden
            ? "无法删除已关联明细"
            : "删除失败"
        }
      />
    </EditTransactionDirtyProvider>
  );
}

const editTransactionActionBarSx = {
  display: "grid",
  gap: 1.25,
  gridTemplateColumns: "minmax(0, 1fr) minmax(0, 2fr)",
  mt: 0.25,
};

const editTransactionDeleteButtonSx = {
  borderRadius: 1.75,
  fontSize: "1rem",
  fontWeight: 800,
  minHeight: 48,
};

export function EditTransferTransactionTemplate({
  accountOptions,
  action,
  categoryOptions,
  deleteAction,
  errorMessage,
  frequentCategoryIds,
  initialValues,
  merchantOptions,
  transactionItemSpecialStatusEnabled,
}: EditTransferTransactionTemplateProps) {
  const editAction = useLinkedTransactionEditAction(action);
  const activeErrorMessage = errorMessage;
  const [activeType, setActiveType] =
    useState<TransactionRecordType>("transfer");
  const [submitDisabledByType, setSubmitDisabledByType] = useState<
    Record<TransactionRecordType, boolean>
  >({ expense: true, income: true, transfer: true });

  const panels = useMemo(
    () => ({
      expense: (
        <>
          <input
            form={editTransactionFormId("expense")}
            name="sourceType"
            readOnly
            type="hidden"
            value="transfer"
          />
          <TransactionForm
            action={editAction.formAction}
            accountOptions={accountOptions}
            categoryOptions={categoryOptions}
            errorMessage={activeErrorMessage}
            frequentCategoryIds={frequentCategoryIds}
            formId={editTransactionFormId("expense")}
            hideHeader
            hideSubmitButton
            initialValues={createNormalInitialValuesFromTransfer(
              initialValues,
              "expense",
            )}
            merchantOptions={merchantOptions}
            transactionItemSpecialStatusEnabled={
              transactionItemSpecialStatusEnabled
            }
            onSubmitDisabledChange={(disabled) =>
              setSubmitDisabledByType((prev) => ({
                ...prev,
                expense: disabled,
              }))
            }
            submitLabel="保存修改"
          />
        </>
      ),
      income: (
        <>
          <input
            form={editTransactionFormId("income")}
            name="sourceType"
            readOnly
            type="hidden"
            value="transfer"
          />
          <TransactionForm
            action={editAction.formAction}
            accountOptions={accountOptions}
            categoryOptions={categoryOptions}
            errorMessage={activeErrorMessage}
            frequentCategoryIds={frequentCategoryIds}
            formId={editTransactionFormId("income")}
            hideHeader
            hideSubmitButton
            initialValues={createNormalInitialValuesFromTransfer(
              initialValues,
              "income",
            )}
            merchantOptions={merchantOptions}
            transactionItemSpecialStatusEnabled={
              transactionItemSpecialStatusEnabled
            }
            onSubmitDisabledChange={(disabled) =>
              setSubmitDisabledByType((prev) => ({ ...prev, income: disabled }))
            }
            submitLabel="保存修改"
          />
        </>
      ),
      transfer: (
        <TransferTransactionForm
          action={editAction.formAction}
          accountOptions={accountOptions}
          errorMessage={activeErrorMessage}
          formId={editTransactionFormId("transfer")}
          hideHeader
          hideSubmitButton
          initialValues={initialValues}
          onSubmitDisabledChange={(disabled) =>
            setSubmitDisabledByType((prev) => ({ ...prev, transfer: disabled }))
          }
          sourceType="transfer"
        />
      ),
    }),
    [
      editAction.formAction,
      accountOptions,
      categoryOptions,
      frequentCategoryIds,
      activeErrorMessage,
      initialValues,
      merchantOptions,
      transactionItemSpecialStatusEnabled,
    ],
  );

  return (
    <EditTransactionShell
      activeType={activeType}
      deleteAction={deleteAction}
      hasLinkedIncomeItems={false}
      isSaveConfirmationOpen={editAction.isConfirmationOpen}
      isSaveFailureOpen={editAction.isFailureOpen}
      isSavePending={editAction.isPending}
      onCancelSync={editAction.cancelConfirmation}
      onCloseSaveFailure={editAction.closeFailure}
      onConfirmSync={editAction.confirmSync}
      panels={panels}
      saveErrorMessage={editAction.state.error}
      setActiveType={setActiveType}
      submitDisabledByType={submitDisabledByType}
      transactionRecordId={requireEditTransactionRecordId(
        initialValues.transactionRecordId,
      )}
    />
  );
}

export function EditTransactionTemplate({
  accountOptions,
  action,
  categoryOptions,
  deleteAction,
  errorMessage,
  frequentCategoryIds,
  initialValues,
  merchantOptions,
  transactionItemSpecialStatusEnabled,
}: EditTransactionTemplateProps) {
  const editAction = useLinkedTransactionEditAction(action);
  const activeErrorMessage = errorMessage;
  const [activeType, setActiveType] = useState<TransactionRecordType>(
    initialValues.type,
  );
  const [submitDisabledByType, setSubmitDisabledByType] = useState<
    Record<TransactionRecordType, boolean>
  >({ expense: true, income: true, transfer: true });

  const panels = useMemo(
    () => ({
      expense: (
        <>
          <input
            form={editTransactionFormId("expense")}
            name="sourceType"
            readOnly
            type="hidden"
            value={initialValues.type}
          />
          <TransactionForm
            action={editAction.formAction}
            accountOptions={accountOptions}
            categoryOptions={categoryOptions}
            errorMessage={activeErrorMessage}
            frequentCategoryIds={frequentCategoryIds}
            formId={editTransactionFormId("expense")}
            hideHeader
            hideSubmitButton
            initialValues={createNormalInitialValuesFromNormal(
              initialValues,
              "expense",
            )}
            merchantOptions={merchantOptions}
            transactionItemSpecialStatusEnabled={
              transactionItemSpecialStatusEnabled
            }
            onSubmitDisabledChange={(disabled) =>
              setSubmitDisabledByType((prev) => ({
                ...prev,
                expense: disabled,
              }))
            }
            submitLabel="保存修改"
          />
        </>
      ),
      income: (
        <>
          <input
            form={editTransactionFormId("income")}
            name="sourceType"
            readOnly
            type="hidden"
            value={initialValues.type}
          />
          <TransactionForm
            action={editAction.formAction}
            accountOptions={accountOptions}
            categoryOptions={categoryOptions}
            errorMessage={activeErrorMessage}
            frequentCategoryIds={frequentCategoryIds}
            formId={editTransactionFormId("income")}
            hideHeader
            hideSubmitButton
            initialValues={createNormalInitialValuesFromNormal(
              initialValues,
              "income",
            )}
            merchantOptions={merchantOptions}
            transactionItemSpecialStatusEnabled={
              transactionItemSpecialStatusEnabled
            }
            onSubmitDisabledChange={(disabled) =>
              setSubmitDisabledByType((prev) => ({ ...prev, income: disabled }))
            }
            submitLabel="保存修改"
          />
        </>
      ),
      transfer: (
        <TransferTransactionForm
          action={editAction.formAction}
          accountOptions={accountOptions}
          errorMessage={activeErrorMessage}
          formId={editTransactionFormId("transfer")}
          hideHeader
          hideSubmitButton
          initialValues={createTransferInitialValuesFromNormal(
            initialValues,
            accountOptions,
          )}
          onSubmitDisabledChange={(disabled) =>
            setSubmitDisabledByType((prev) => ({ ...prev, transfer: disabled }))
          }
          sourceType={initialValues.type}
        />
      ),
    }),
    [
      editAction.formAction,
      accountOptions,
      categoryOptions,
      frequentCategoryIds,
      activeErrorMessage,
      initialValues,
      merchantOptions,
      transactionItemSpecialStatusEnabled,
    ],
  );

  return (
    <EditTransactionShell
      activeType={activeType}
      deleteAction={deleteAction}
      hasLinkedIncomeItems={initialValues.items.some(
        (item) => item.businessStatus?.incomeLinkRole != null,
      )}
      isSaveConfirmationOpen={editAction.isConfirmationOpen}
      isSaveFailureOpen={editAction.isFailureOpen}
      isSavePending={editAction.isPending}
      onCancelSync={editAction.cancelConfirmation}
      onCloseSaveFailure={editAction.closeFailure}
      onConfirmSync={editAction.confirmSync}
      panels={panels}
      saveErrorMessage={editAction.state.error}
      setActiveType={setActiveType}
      submitDisabledByType={submitDisabledByType}
      transactionRecordId={requireEditTransactionRecordId(
        initialValues.transactionRecordId,
      )}
    />
  );
}

function createNormalInitialValuesFromNormal(
  initialValues: TransactionFormInitialValues,
  targetType: TransactionType,
): TransactionFormInitialValues {
  if (targetType === initialValues.type) return initialValues;

  return {
    ...initialValues,
    items: [],
    type: targetType,
  };
}

function createTransferInitialValuesFromNormal(
  initialValues: TransactionFormInitialValues,
  accountOptions: TransactionAccountOption[],
): TransferEditInitialValues {
  return {
    accountId: initialValues.accountId,
    note: initialValues.note,
    transactionAt: initialValues.transactionAt,
    transactionRecordId: requireEditTransactionRecordId(
      initialValues.transactionRecordId,
    ),
    transferAmount: totalAmountText(initialValues.items),
    transferTargetAccountId: findTransferTargetAccountId(
      accountOptions,
      initialValues.accountId,
    ),
    type: "transfer",
  };
}

function createNormalInitialValuesFromTransfer(
  initialValues: TransferEditInitialValues,
  targetType: TransactionType,
): TransactionFormInitialValues {
  return {
    accountId: initialValues.accountId,
    items: [],
    merchantId: "",
    note: initialValues.note,
    transactionAt: initialValues.transactionAt,
    transactionRecordId: initialValues.transactionRecordId,
    type: targetType,
  };
}

function totalAmountText(items: TransactionFormInitialValues["items"]) {
  const total = items.reduce((sum, item) => {
    const amount = Number(item.amount);
    return Number.isFinite(amount) ? sum + amount : sum;
  }, 0);

  if (total <= 0) return "";

  return total
    .toFixed(2)
    .replace(/\.00$/, "")
    .replace(/(\.\d)0$/, "$1");
}

function findTransferTargetAccountId(
  accountOptions: TransactionAccountOption[],
  accountId: string,
) {
  const sourceAccount = accountOptions.find(
    (account) => account.id === accountId,
  );
  const sameCurrencyAccount = accountOptions.find(
    (account) =>
      account.id !== accountId && account.currency === sourceAccount?.currency,
  );

  return sameCurrencyAccount?.id ?? "";
}
