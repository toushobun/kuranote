"use client";

import { useActionState } from "react";

import {
  BackLayerScope,
  transactionBackLayerLevels,
} from "molecules/ui/UnsavedChangesDialog/BackLayerScope";
import { useUnsavedChangesForm } from "molecules/ui/UnsavedChangesDialog/useUnsavedChangesForm";
import { UnsavedChangesDialog } from "molecules/ui/UnsavedChangesDialog/UnsavedChangesDialog";
import { EditTransactionDirtyProvider } from "organisms/transactions/EditTransactionDirtyContext/EditTransactionDirtyContext";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Link from "next/link";

import {
  accountsNewHref,
  routePaths,
  transactionsNewEntryHref,
} from "config/paths";
import { flowMessages } from "config/transactionStepFlowMessages";
import { ErrorState } from "molecules/ui/ErrorState";
import type { TransactionEditRestriction } from "internal/transaction";
import { TransactionAmountKeypadLauncher } from "organisms/transactions/TransactionAmountKeypadLauncher/TransactionAmountKeypadLauncher";
import { TransactionEntryMethodSwitch } from "organisms/transactions/TransactionEntryMethodSwitch/TransactionEntryMethodSwitch";
import { TransferTransactionForm } from "organisms/transactions/TransferTransactionForm/TransferTransactionForm";
import type {
  TransactionAccountOption,
  TransactionStateAction,
  TransferEditInitialValues,
} from "types/transactions";
import { EditTransactionShell } from "./EditTransactionShell";
import { TransactionPageTopBar } from "./TransactionPageTopBar";
import { useEditAccountOptions } from "./useEditAccountOptions";

type TransactionFormTemplateProps = {
  accountOptions: TransactionAccountOption[];
  action: TransactionStateAction;
};

type EditTransferTransactionTemplateProps = TransactionFormTemplateProps & {
  /** 已归档的转出 / 转入账户（只读时用来显示原账户名称与币种，#966）。 */
  archivedAccountOptions?: TransactionAccountOption[];
  canDelete: boolean;
  deleteAction: TransactionStateAction;
  /** 有限制时显示只读详情（#928）：表单整体禁用，不显示保存。 */
  editRestriction: TransactionEditRestriction | null;
  initialValues: TransferEditInitialValues;
};

const editTransferTransactionFormId = "edit-transfer-transaction-form";

/** 记账方式「账户周转」（#943）：沿用现有转账表单。 */
export function NewTransferTransactionTemplate({
  accountOptions,
  action,
}: TransactionFormTemplateProps) {
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
