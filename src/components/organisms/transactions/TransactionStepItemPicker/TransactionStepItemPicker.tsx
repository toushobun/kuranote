"use client";
import { TransactionItemPickerDrawer } from "organisms/transactions/TransactionItemPickerDrawer/TransactionItemPickerDrawer";
import { useTransactionItemsStep } from "../TransactionItemsStep/useTransactionItemsStep";
import type { TransactionItemsStepProps } from "../TransactionItemsStep/TransactionItemsStep.types";

/** 分步流程的选择分类抽屉：明细步骤与确认页（小票）添加 / 编辑明细共用。 */
export function TransactionStepItemPicker(props: TransactionItemsStepProps) {
  const w = useTransactionItemsStep(props);
  const f = w.form;
  return (
    <TransactionItemPickerDrawer
      {...props}
      inWizard
      showFrequentCategories={false}
      showAmountInput={false}
      frequentCategoryIds={[]}
      categoryGroups={f.categoryGroups}
      filteredCategoryOptions={f.allNormalCategoryOptions}
      editingItemId={f.editingItemId}
      linkNotice={f.linkNotice}
      open={f.isSheetOpen}
      onClose={f.closeSheet}
      pickerAmount={f.pickerAmount}
      pickerCategoryId={f.pickerCategoryId}
      pickerErrors={f.pickerErrors}
      pickerSpecialStatus={f.pickerSpecialStatus}
      specialStatusLocked={f.pickerSpecialStatusLocked}
      pickerRefundCandidate={f.pickerRefundCandidate}
      pickerReimbursementCandidate={f.pickerReimbursementCandidate}
      selectedAccountCurrency={w.currency}
      selectedCategoryGroup={f.selectedCategoryGroup}
      specialStatusEnabled={props.transactionItemSpecialStatusEnabled}
      incomeCategoriesDisabled={f.isMultiAccount}
      onAmountChange={f.handlePickerAmountChange}
      onCategoryToggle={f.handlePickerCategoryToggle}
      onGroupSelect={f.handlePickerGroupSelect}
      onPickerAdd={f.handlePickerAdd}
      onRemoveItem={f.removeItem}
      onSpecialStatusChange={f.setPickerSpecialStatus}
      onRefundItemChange={f.setPickerRefundCandidate}
      onReimbursementItemChange={f.setPickerReimbursementCandidate}
    />
  );
}
