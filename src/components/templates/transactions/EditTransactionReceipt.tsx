"use client";
import { useReceiptCreation } from "organisms/transactions/ReceiptCreationProvider/ReceiptCreationProvider";
import { mergeReceiptOptions } from "organisms/transactions/ReceiptCreationProvider/useReceiptCreationState";

import { flowMessages as m } from "config/transactionStepFlowMessages";
import type {
  FrequentMerchant,
  TransactionEditRestriction,
} from "internal/transaction";
import { ReceiptMerchantDrawer } from "organisms/transactions/ReceiptMerchantDrawer/ReceiptMerchantDrawer";
import type { FlowMerchant } from "organisms/transactions/MerchantStep/MerchantStep.types";
import { TransactionConfirmStep } from "organisms/transactions/TransactionConfirmStep/TransactionConfirmStep";
import type { TransactionFormInitialValues } from "organisms/transactions/TransactionForm/TransactionForm.types";
import type { MerchantTag } from "types/merchants";
import type {
  TransactionAccountOption,
  TransactionCategoryOption,
  TransactionStateAction,
} from "types/transactions";

import { EditTransactionShell } from "./EditTransactionShell";
import { useEditAccountOptions } from "./useEditAccountOptions";
import { useEditTransactionReceipt } from "./useEditTransactionReceipt";
import { useLinkedTransactionEditAction } from "./useLinkedTransactionEditAction";

const editReceiptFormId = "edit-transaction-receipt-form";

type EditTransactionReceiptTemplateProps = {
  accountOptions: TransactionAccountOption[];
  action: TransactionStateAction;
  /** 已归档的付款账户（只读时用来显示账户名称与记录实际币种）。 */
  archivedAccountOptions?: TransactionAccountOption[];
  canDelete: boolean;
  categoryOptions: TransactionCategoryOption[];
  deleteAction: TransactionStateAction;
  /** 有限制时显示只读小票（没有铅笔、×、保存）。 */
  editRestriction: TransactionEditRestriction | null;
  frequentMerchants: FrequentMerchant[];
  initialValues: TransactionFormInitialValues;
  ledgerId: string;
  merchantOptions: FlowMerchant[];
  merchantTags: MerchantTag[];
  multiAccountPaymentEnabled: boolean;
  transactionItemSpecialStatusEnabled: boolean;
};

/** 编辑普通记录（#962）：显示预填的小票，删除按钮在保存下方。 */
export function EditTransactionReceiptTemplate(
  props: EditTransactionReceiptTemplateProps,
) {
  const editAction = useLinkedTransactionEditAction(props.action);
  const transactionRecordId = props.initialValues.transactionRecordId;
  if (!transactionRecordId) {
    throw new Error("transactionRecordId is required for edit transaction.");
  }

  return (
    <EditTransactionShell
      canDelete={props.canDelete}
      deleteAction={props.deleteAction}
      editAction={editAction}
      editRestriction={props.editRestriction}
      hasLinkedIncomeItems={props.initialValues.items.some(
        (item) => item.businessStatus?.incomeLinkRole != null,
      )}
      saveFormId={editReceiptFormId}
      transactionRecordId={transactionRecordId}
    >
      <EditTransactionReceipt
        {...props}
        formAction={editAction.formAction}
        saving={editAction.isPending}
      />
    </EditTransactionShell>
  );
}

// 在外框的 EditTransactionDirtyProvider 内创建表单，修改小票时标记为未保存。
function EditTransactionReceipt({
  formAction,
  saving,
  ...input
}: EditTransactionReceiptTemplateProps & {
  formAction: (formData: FormData) => void;
  saving: boolean;
}) {
  const creation = useReceiptCreation();
  const props = {
    ...input,
    merchantOptions: mergeReceiptOptions(
      input.merchantOptions,
      creation?.merchants,
    ),
    accountOptions: mergeReceiptOptions(
      input.accountOptions,
      creation?.accounts,
    ),
  };
  const readOnly = props.editRestriction !== null;
  const accountOptions = useEditAccountOptions(
    props.accountOptions,
    props.archivedAccountOptions,
  );
  const w = useEditTransactionReceipt({
    accountOptions,
    initialValues: props.initialValues,
    itemsOptions: {
      categoryOptions: props.categoryOptions,
      multiAccountPaymentEnabled: props.multiAccountPaymentEnabled,
      transactionItemSpecialStatusEnabled:
        props.transactionItemSpecialStatusEnabled,
    },
    ledgerId: props.ledgerId,
    merchantOptions: props.merchantOptions,
    readOnly,
  });

  return (
    <>
      {/* 编辑前后都是普通记录；记录类型由服务端按净额决定。 */}
      <input
        form={editReceiptFormId}
        name="sourceType"
        readOnly
        type="hidden"
        value={props.initialValues.type}
      />
      <TransactionConfirmStep
        {...w.itemsOptions}
        form={w.form}
        formId={editReceiptFormId}
        initialValues={props.initialValues}
        automaticItemIds={[]}
        amountItemId={w.amountItemId}
        onAmountItemChange={w.setAmountItemId}
        accountOptions={accountOptions}
        suggestions={w.suggestions}
        action={formAction}
        saving={saving}
        submitLabel={m.saveEdit}
        onMerchantClick={w.merchantPicker.openPicker}
        readOnly={readOnly}
      />
      <ReceiptMerchantDrawer
        picker={w.merchantPicker}
        merchants={props.merchantOptions}
        merchantTags={props.merchantTags}
        frequentMerchants={props.frequentMerchants}
      />
    </>
  );
}
