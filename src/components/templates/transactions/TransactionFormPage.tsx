"use client";

import {
  useActionState,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  BackLayerScope,
  transactionBackLayerLevels,
} from "molecules/ui/UnsavedChangesDialog/BackLayerScope";
import { useUnsavedChangesForm } from "molecules/ui/UnsavedChangesDialog/useUnsavedChangesForm";
import { useUnsavedChangesGuard } from "molecules/ui/UnsavedChangesDialog/useUnsavedChangesGuard";
import { UnsavedChangesDialog } from "molecules/ui/UnsavedChangesDialog/UnsavedChangesDialog";
import { EditTransactionDirtyProvider } from "organisms/transactions/EditTransactionDirtyContext/EditTransactionDirtyContext";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Link from "next/link";

import {
  accountsNewHref,
  merchantsNewHref,
  routePaths,
  transactionsNewEntryHref,
} from "config/paths";
import { flowMessages } from "config/transactionStepFlowMessages";
import { ErrorState } from "molecules/ui/ErrorState";
import type { TransactionEditRestriction } from "internal/transaction";
import {
  TransactionTypeNavigation,
  type TransactionTypeNavigationValue,
} from "molecules/transactions/TransactionTypeNavigation";
import { TransactionAmountKeypadLauncher } from "organisms/transactions/TransactionAmountKeypadLauncher/TransactionAmountKeypadLauncher";
import { TransactionForm } from "organisms/transactions/TransactionForm/TransactionForm";
import { TransactionEntryMethodSwitch } from "organisms/transactions/TransactionEntryMethodSwitch/TransactionEntryMethodSwitch";
import { TransferTransactionForm } from "organisms/transactions/TransferTransactionForm/TransferTransactionForm";
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
  TransferEditInitialValues,
} from "types/transactions";
import { EditTransactionShell } from "./EditTransactionShell";
import { TransactionPageTopBar } from "./TransactionPageTopBar";
import { useEditAccountOptions } from "./useEditAccountOptions";

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
  multiAccountPaymentEnabled: boolean;
  transactionItemSpecialStatusEnabled: boolean;
};

type EditTransferTransactionTemplateProps = Pick<
  TransactionFormTemplateProps,
  "accountOptions" | "action"
> & {
  /** 已归档的转出 / 转入账户（只读时用来显示原账户名称与币种，#966）。 */
  archivedAccountOptions?: TransactionAccountOption[];
  canDelete: boolean;
  deleteAction: TransactionStateAction;
  /** 有限制时显示只读详情（#928）：表单整体禁用，不显示保存。 */
  editRestriction: TransactionEditRestriction | null;
  initialValues: TransferEditInitialValues;
};

const transactionTypeOrder: readonly TransactionRecordType[] = [
  "expense",
  "income",
  "transfer",
];

const editTransferTransactionFormId = "edit-transfer-transaction-form";

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
    <BackLayerScope level={transactionBackLayerLevels.pageOverlay}>
      <NewTransactionFormView {...props} />
      <TransactionAmountKeypadLauncher />
    </BackLayerScope>
  );
}

/** 记账方式「账户周转」（#943）：沿用现有转账表单。 */
export function NewTransferTransactionTemplate({
  accountOptions,
  action,
}: Pick<TransactionFormTemplateProps, "accountOptions" | "action">) {
  const guard = useUnsavedChangesForm("new-transfer-transaction-form", action);
  const [actionState, formAction] = useActionState(guard.action, {});
  return (
    <BackLayerScope level={transactionBackLayerLevels.pageOverlay}>
      <EditTransactionDirtyProvider onDirty={guard.onDirtyChange}>
        <Stack spacing={0}>
          <TransactionPageTopBar
            title={flowMessages.transferTitle}
            action={
              <TransactionEntryMethodSwitch
                currentMethod="transfer"
                requestNavigate={guard.requestNavigate}
              />
            }
          />
          <TransferTransactionForm
            action={formAction}
            accountOptions={accountOptions}
            addAccountHref={accountsNewHref(
              transactionsNewEntryHref({ method: "transfer" }),
            )}
            errorMessage={actionState.error ?? null}
            formId="new-transfer-transaction-form"
            hideHeader
          />
        </Stack>
        <TransactionAmountKeypadLauncher />
      </EditTransactionDirtyProvider>
      <UnsavedChangesDialog {...guard.dialogProps} />
    </BackLayerScope>
  );
}

// 当前账本角色不能新增记账时的整页提示。查看已有记录不走这里，有限制时编辑页显示只读详情（#928）。
export function TransactionPermissionDenied() {
  return (
    <Stack spacing={2}>
      <TransactionPageTopBar title="新增记账" />
      <ErrorState
        title="无法新增记账"
        description="当前账本角色没有新增记账的权限。"
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

// 添加账户 / 商家后带着当前页签返回标准记账。
function newTransactionSetupHrefs(type: TransactionType) {
  const returnTo = transactionsNewEntryHref({ method: "standard", type });

  return {
    account: accountsNewHref(returnTo),
    merchant: merchantsNewHref(returnTo),
  };
}

function GuardedPanel({
  type,
  activeType,
  onDirty,
  children,
}: {
  type: TransactionRecordType;
  activeType: TransactionRecordType;
  onDirty: (dirty: boolean) => void;
  children: ReactNode;
}) {
  return (
    <EditTransactionDirtyProvider onDirty={onDirty}>
      <BackLayerScope
        level={
          activeType === type ? transactionBackLayerLevels.pageOverlay : null
        }
      >
        {children}
      </BackLayerScope>
    </EditTransactionDirtyProvider>
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
  multiAccountPaymentEnabled,
  transactionItemSpecialStatusEnabled,
}: TransactionFormTemplateProps) {
  const [dirtyByType, setDirtyByType] = useState({
    expense: false,
    income: false,
    transfer: false,
  });
  const reportDirty = useMemo(
    () =>
      Object.fromEntries(
        transactionTypeOrder.map((type) => [
          type,
          (dirty: boolean) =>
            setDirtyByType((previous) =>
              previous[type] === dirty
                ? previous
                : { ...previous, [type]: dirty },
            ),
        ]),
      ) as Record<TransactionRecordType, (dirty: boolean) => void>,
    [],
  );
  const [activeType, setActiveType] = useState<TransactionRecordType>(
    initialType ?? "expense",
  );
  const guard = useUnsavedChangesGuard({
    isDirty: dirtyByType[activeType],
    saveFormId: `new-${activeType}-transaction-form`,
  });
  const [actionState, formAction] = useActionState(
    (state: Awaited<ReturnType<TransactionStateAction>>, data: FormData) =>
      guard.runAction(() => action(state, data)),
    {},
  );
  const activeErrorMessage = actionState.error ?? errorMessage;
  const lastNormalTypeRef = useRef<TransactionType>(
    initialType === "income" ? "income" : "expense",
  );
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
        <GuardedPanel
          type="expense"
          activeType={activeType}
          onDirty={reportDirty.expense}
        >
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
            setupHrefs={newTransactionSetupHrefs("expense")}
            multiAccountPaymentEnabled={multiAccountPaymentEnabled}
            transactionItemSpecialStatusEnabled={
              transactionItemSpecialStatusEnabled
            }
          />
        </GuardedPanel>
      ),
      income: (
        <GuardedPanel
          type="income"
          activeType={activeType}
          onDirty={reportDirty.income}
        >
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
            setupHrefs={newTransactionSetupHrefs("income")}
            multiAccountPaymentEnabled={multiAccountPaymentEnabled}
            transactionItemSpecialStatusEnabled={
              transactionItemSpecialStatusEnabled
            }
          />
        </GuardedPanel>
      ),
      transfer: (
        <GuardedPanel
          type="transfer"
          activeType={activeType}
          onDirty={reportDirty.transfer}
        >
          <TransferTransactionForm
            action={formAction}
            accountOptions={accountOptions}
            addAccountHref={accountsNewHref(
              transactionsNewEntryHref({
                method: "standard",
                type: "transfer",
              }),
            )}
            errorMessage={activeErrorMessage}
            formId="new-transfer-transaction-form"
            hideHeader
          />
        </GuardedPanel>
      ),
    }),
    [
      formAction,
      activeType,
      reportDirty,
      accountOptions,
      categoryOptions,
      frequentCategoryIds,
      activeErrorMessage,
      merchantOptions,
      refundPickerView,
      loadRefundGroupItemsAction,
      loadRefundMoreGroupsAction,
      loadRefundSearchPageAction,
      multiAccountPaymentEnabled,
      transactionItemSpecialStatusEnabled,
    ],
  );

  return (
    <Stack spacing={0}>
      <TransactionPageTopBar
        title="记一笔"
        action={
          <TransactionEntryMethodSwitch
            currentMethod="standard"
            requestNavigate={guard.requestNavigate}
          />
        }
      />
      <TransactionTypeNavigation
        activeType={activeType === "transfer" ? "transfer" : "normal"}
        onChange={handleNewTypeChange}
      />
      <TransactionTypeSlidePanels activeType={activeType} panels={panels} />
      <UnsavedChangesDialog {...guard.dialogProps} />
    </Stack>
  );
}

/** 编辑转账（#962）：只能修改转账本身，不再与支出 / 收入互相转换。 */
export function EditTransferTransactionTemplate({
  accountOptions: availableAccountOptions,
  action,
  archivedAccountOptions,
  canDelete,
  deleteAction,
  editRestriction,
  initialValues,
}: EditTransferTransactionTemplateProps) {
  const readOnly = editRestriction !== null;
  const accountOptions = useEditAccountOptions(
    availableAccountOptions,
    archivedAccountOptions,
  );

  return (
    <BackLayerScope level={transactionBackLayerLevels.pageOverlay}>
      <EditTransactionShell
        action={action}
        canDelete={canDelete}
        deleteAction={deleteAction}
        editRestriction={editRestriction}
        hasLinkedIncomeItems={false}
        saveFormId={editTransferTransactionFormId}
        transactionRecordId={initialValues.transactionRecordId}
      >
        {(editAction) => (
          <>
            <TransferTransactionForm
              action={editAction.formAction}
              accountOptions={accountOptions}
              formId={editTransferTransactionFormId}
              hideHeader
              hideSubmitButton={readOnly}
              initialValues={initialValues}
              readOnly={readOnly}
              sourceType="transfer"
            />
            {readOnly ? null : <TransactionAmountKeypadLauncher />}
          </>
        )}
      </EditTransactionShell>
    </BackLayerScope>
  );
}
