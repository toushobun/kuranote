"use client";

import {
  BackLayerScope,
  transactionBackLayerLevels,
} from "molecules/ui/UnsavedChangesDialog/BackLayerScope";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Link from "next/link";

import { routePaths } from "config/paths";
import { ErrorState } from "molecules/ui/ErrorState";
import type { TransactionEditRestriction } from "internal/transaction";
import { useReceiptCreation } from "organisms/transactions/ReceiptCreationProvider/ReceiptCreationProvider";
import { mergeReceiptOptions } from "organisms/transactions/ReceiptCreationProvider/useReceiptCreationState";
import { TransferReceipt } from "organisms/transactions/TransferReceipt/TransferReceipt";
import type {
  TransactionAccountOption,
  TransactionStateAction,
  TransferEditInitialValues,
} from "types/transactions";
import { EditTransactionShell } from "./EditTransactionShell";
import { TransactionPageTopBar } from "./TransactionPageTopBar";
import { useEditAccountOptions } from "./useEditAccountOptions";

type EditTransferTransactionTemplateProps = {
  accountOptions: TransactionAccountOption[];
  action: TransactionStateAction;
  /** 已归档的转出 / 转入账户（只读时用来显示原账户名称与币种，#966）。 */
  archivedAccountOptions?: TransactionAccountOption[];
  canDelete: boolean;
  deleteAction: TransactionStateAction;
  /** 有限制时显示只读详情（#928）：小票没有铅笔，不显示保存。 */
  editRestriction: TransactionEditRestriction | null;
  initialValues: TransferEditInitialValues;
};

const editTransferTransactionFormId = "edit-transfer-transaction-form";

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

/** 编辑转账（#962）：转账小票（#1050），只能修改转账本身，不再与支出 / 收入互相转换。 */
export function EditTransferTransactionTemplate({
  accountOptions: availableAccountOptions,
  action,
  archivedAccountOptions,
  canDelete,
  deleteAction,
  editRestriction,
  initialValues,
}: EditTransferTransactionTemplateProps) {
  const creation = useReceiptCreation();
  const accountOptions = useEditAccountOptions(
    mergeReceiptOptions(availableAccountOptions, creation?.accounts),
    archivedAccountOptions,
  );

  return (
    <BackLayerScope level={transactionBackLayerLevels.receiptEditor}>
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
          <TransferReceipt
            formId={editTransferTransactionFormId}
            action={editAction.formAction}
            accountOptions={accountOptions}
            initialValues={initialValues}
            sourceType="transfer"
            readOnly={editRestriction !== null}
            saving={editAction.isPending}
            onValidationFailed={editAction.onValidationFailed}
          />
        )}
      </EditTransactionShell>
    </BackLayerScope>
  );
}
