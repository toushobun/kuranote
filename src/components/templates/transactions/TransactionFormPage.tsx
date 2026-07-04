"use client";

import {
  useCallback,
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
import { DeleteConfirmationDialog } from "molecules/ui/OperationFeedbackDialogs";
import {
  TransactionTypeNavigation,
  type TransactionTypeNavigationValue,
} from "molecules/transactions/TransactionTypeNavigation";
import { TransactionAmountKeypadLauncher } from "organisms/transactions/TransactionAmountKeypadLauncher";
import { EditTransactionDirtyProvider } from "organisms/transactions/EditTransactionDirtyContext";
import {
  TransactionForm,
  type TransactionFormInitialValues,
} from "organisms/transactions/TransactionForm";
import { transactionSubmitButtonSx } from "organisms/transactions/TransactionForm.styles";
import { TransferTransactionForm } from "organisms/transactions/TransferTransactionForm";
import type { TransferEditInitialValues } from "server/loaders/transactionForm";
import type {
  TransactionAccountOption,
  TransactionCategoryOption,
  TransactionMerchantOption,
  TransactionRecordType,
  TransactionTagOption,
  TransactionType,
} from "types/transactions";

export type TransactionFormTemplateProps = {
  accountOptions: TransactionAccountOption[];
  action: (formData: FormData) => Promise<void>;
  categoryOptions: TransactionCategoryOption[];
  errorMessage: string | null;
  initialType?: TransactionRecordType;
  ledgerName: string;
  merchantOptions: TransactionMerchantOption[];
  tagOptions: TransactionTagOption[];
};

type EditTransactionTemplateProps = Omit<
  TransactionFormTemplateProps,
  "initialType"
> & {
  deleteAction: (formData: FormData) => Promise<void>;
  initialValues: TransactionFormInitialValues;
};

type EditTransferTransactionTemplateProps = Omit<
  TransactionFormTemplateProps,
  "initialType"
> & {
  deleteAction: (formData: FormData) => Promise<void>;
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

function NewTransactionFormView({
  accountOptions,
  action,
  categoryOptions,
  errorMessage,
  initialType,
  merchantOptions,
  tagOptions,
}: TransactionFormTemplateProps) {
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
          action={action}
          accountOptions={accountOptions}
          categoryOptions={categoryOptions}
          errorMessage={errorMessage}
          formId="new-expense-transaction-form"
          hideHeader
          initialType="expense"
          merchantOptions={merchantOptions}
          onSubmitDisabledChange={(disabled) =>
            setSubmitDisabledByType((prev) => ({ ...prev, expense: disabled }))
          }
          tagOptions={tagOptions}
        />
      ),
      income: (
        <TransactionForm
          action={action}
          accountOptions={accountOptions}
          categoryOptions={categoryOptions}
          errorMessage={errorMessage}
          formId="new-income-transaction-form"
          hideHeader
          initialType="income"
          merchantOptions={merchantOptions}
          onSubmitDisabledChange={(disabled) =>
            setSubmitDisabledByType((prev) => ({ ...prev, income: disabled }))
          }
          tagOptions={tagOptions}
        />
      ),
      transfer: (
        <TransferTransactionForm
          action={action}
          accountOptions={accountOptions}
          errorMessage={errorMessage}
          formId="new-transfer-transaction-form"
          hideHeader
          onSubmitDisabledChange={(disabled) =>
            setSubmitDisabledByType((prev) => ({ ...prev, transfer: disabled }))
          }
        />
      ),
    }),
    [
      action,
      accountOptions,
      categoryOptions,
      errorMessage,
      merchantOptions,
      tagOptions,
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
  deleteAction: (formData: FormData) => Promise<void>;
  panels: Record<TransactionRecordType, ReactNode>;
  setActiveType: (type: TransactionRecordType) => void;
  submitDisabledByType: Record<TransactionRecordType, boolean>;
  transactionRecordId: string;
};

function EditTransactionShell({
  activeType,
  deleteAction,
  panels,
  setActiveType,
  submitDisabledByType,
  transactionRecordId,
}: EditTransactionShellProps) {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isExitDialogOpen, setIsExitDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
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
      <Stack
        onChangeCapture={markDirty}
        onSubmit={(event) => {
          if (!event.defaultPrevented) setHasUnsavedChanges(false);
        }}
        spacing={0}
      >
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
            disabled={submitDisabledByType[activeType]}
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
      <form action={deleteAction} id={deleteTransactionFormId}>
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
        description="删除后这笔记账会从明细页移除，是否继续？"
        onCancel={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        open={isDeleteDialogOpen}
        title="删除记账？"
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
  initialValues,
  merchantOptions,
  tagOptions,
}: EditTransferTransactionTemplateProps) {
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
            action={action}
            accountOptions={accountOptions}
            categoryOptions={categoryOptions}
            errorMessage={errorMessage}
            formId={editTransactionFormId("expense")}
            hideHeader
            hideSubmitButton
            initialValues={createNormalInitialValuesFromTransfer(
              initialValues,
              "expense",
            )}
            merchantOptions={merchantOptions}
            onSubmitDisabledChange={(disabled) =>
              setSubmitDisabledByType((prev) => ({
                ...prev,
                expense: disabled,
              }))
            }
            submitLabel="保存修改"
            tagOptions={tagOptions}
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
            action={action}
            accountOptions={accountOptions}
            categoryOptions={categoryOptions}
            errorMessage={errorMessage}
            formId={editTransactionFormId("income")}
            hideHeader
            hideSubmitButton
            initialValues={createNormalInitialValuesFromTransfer(
              initialValues,
              "income",
            )}
            merchantOptions={merchantOptions}
            onSubmitDisabledChange={(disabled) =>
              setSubmitDisabledByType((prev) => ({ ...prev, income: disabled }))
            }
            submitLabel="保存修改"
            tagOptions={tagOptions}
          />
        </>
      ),
      transfer: (
        <TransferTransactionForm
          action={action}
          accountOptions={accountOptions}
          errorMessage={errorMessage}
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
      action,
      accountOptions,
      categoryOptions,
      errorMessage,
      initialValues,
      merchantOptions,
      tagOptions,
    ],
  );

  return (
    <EditTransactionShell
      activeType={activeType}
      deleteAction={deleteAction}
      panels={panels}
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
  initialValues,
  merchantOptions,
  tagOptions,
}: EditTransactionTemplateProps) {
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
            action={action}
            accountOptions={accountOptions}
            categoryOptions={categoryOptions}
            errorMessage={errorMessage}
            formId={editTransactionFormId("expense")}
            hideHeader
            hideSubmitButton
            initialValues={createNormalInitialValuesFromNormal(
              initialValues,
              "expense",
            )}
            merchantOptions={merchantOptions}
            onSubmitDisabledChange={(disabled) =>
              setSubmitDisabledByType((prev) => ({
                ...prev,
                expense: disabled,
              }))
            }
            submitLabel="保存修改"
            tagOptions={tagOptions}
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
            action={action}
            accountOptions={accountOptions}
            categoryOptions={categoryOptions}
            errorMessage={errorMessage}
            formId={editTransactionFormId("income")}
            hideHeader
            hideSubmitButton
            initialValues={createNormalInitialValuesFromNormal(
              initialValues,
              "income",
            )}
            merchantOptions={merchantOptions}
            onSubmitDisabledChange={(disabled) =>
              setSubmitDisabledByType((prev) => ({ ...prev, income: disabled }))
            }
            submitLabel="保存修改"
            tagOptions={tagOptions}
          />
        </>
      ),
      transfer: (
        <TransferTransactionForm
          action={action}
          accountOptions={accountOptions}
          errorMessage={errorMessage}
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
      action,
      accountOptions,
      categoryOptions,
      errorMessage,
      initialValues,
      merchantOptions,
      tagOptions,
    ],
  );

  return (
    <EditTransactionShell
      activeType={activeType}
      deleteAction={deleteAction}
      panels={panels}
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
    tagNames: [],
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
