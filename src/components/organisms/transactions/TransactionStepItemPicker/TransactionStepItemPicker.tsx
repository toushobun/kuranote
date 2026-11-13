"use client";
import { TransactionItemPickerDrawer } from "organisms/transactions/TransactionItemPickerDrawer/TransactionItemPickerDrawer";
import type { TransactionReceiptProps } from "../TransactionConfirmStep/TransactionConfirmStep.types";

/** 从商家记账的选择分类抽屉：小票内添加 / 编辑明细。 */
export function TransactionStepItemPicker(props: TransactionReceiptProps) {
  const f = props.form;
  return (
    <TransactionItemPickerDrawer
      {...props}
      categoryGroups={f.categoryGroups}
      filteredCategoryOptions={f.allNormalCategoryOptions}
      editingItemId={f.editingItemId}
      linkNotice={f.linkNotice}
      open={f.isSheetOpen}
      onClose={f.closeSheet}
      pickerAmount={f.pickerAmount}
      pickerMode={f.pickerMode}
      pickerModeLocked={f.pickerModeLocked}
      merchantId={f.selectedMerchantId}
      merchantName={f.selectedMerchant?.name}
      multiAccount={f.isMultiAccount}
      onPickerModeChange={f.handlePickerModeChange}
      onPickerAmountChange={f.setPickerAmount}
      pickerCategoryId={f.pickerCategoryId}
      pickerErrors={f.pickerErrors}
      pickerSpecialStatus={f.pickerSpecialStatus}
      specialStatusLocked={f.pickerSpecialStatusLocked}
      pickerRefundCandidate={f.pickerRefundCandidate}
      pickerReimbursementCandidate={f.pickerReimbursementCandidate}
      resolveLinkCandidate={f.resolveLinkCandidate}
      selectedAccountCurrency={f.selectedAccount?.currency}
      selectedCategoryGroup={f.selectedCategoryGroup}
      specialStatusEnabled={props.transactionItemSpecialStatusEnabled}
      disabledCategoryType={f.disabledCategoryType}
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
