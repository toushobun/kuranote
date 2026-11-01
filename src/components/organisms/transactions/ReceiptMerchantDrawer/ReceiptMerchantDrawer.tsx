"use client";
import { flowMessages as m } from "config/transactionStepFlowMessages";
import { TransactionBottomEditorDrawer } from "molecules/transactions/TransactionBottomEditorDrawer/TransactionBottomEditorDrawer";
import { MerchantStep } from "organisms/transactions/MerchantStep/MerchantStep";
import type { MerchantStepProps } from "organisms/transactions/MerchantStep/MerchantStep.types";

/** 新增与编辑小票使用同一个商家抽屉，保留底层小票和新增弹层期间的搜索状态。 */
export function ReceiptMerchantDrawer({
  open,
  suspended,
  onClose,
  ...selection
}: MerchantStepProps & {
  open: boolean;
  suspended: boolean;
  onClose: () => void;
}) {
  return (
    <TransactionBottomEditorDrawer
      open={open}
      suspended={suspended}
      title={m.merchant}
      onClose={onClose}
    >
      <MerchantStep {...selection} />
    </TransactionBottomEditorDrawer>
  );
}
