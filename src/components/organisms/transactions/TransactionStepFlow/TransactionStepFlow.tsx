"use client";
import { useReceiptCreation } from "organisms/transactions/ReceiptCreationProvider/ReceiptCreationProvider";
import { mergeReceiptOptions } from "organisms/transactions/ReceiptCreationProvider/useReceiptCreationState";

import {
  BackLayerScope,
  transactionBackLayerLevels,
} from "molecules/ui/UnsavedChangesDialog/BackLayerScope";
import { UnsavedChangesDialog } from "molecules/ui/UnsavedChangesDialog/UnsavedChangesDialog";
import Button from "@mui/material/Button";
import DialogContent from "@mui/material/DialogContent";
import { TransactionConfirmStep } from "../TransactionConfirmStep/TransactionConfirmStep";
import { WizardDialog } from "molecules/ui/WizardDialog/WizardDialog";
import { ReceiptMerchantDrawer } from "organisms/transactions/ReceiptMerchantDrawer/ReceiptMerchantDrawer";
import { MerchantStep } from "organisms/transactions/MerchantStep/MerchantStep";
import { EntryMethodDrawer } from "organisms/transactions/EntryMethodDrawer/EntryMethodDrawer";
import { flowMessages as m } from "config/transactionStepFlowMessages";
import type { TransactionStepFlowProps } from "./TransactionStepFlow.types";
import { useTransactionStepFlow } from "./useTransactionStepFlow";

/** 从商家记账（#943 任务 9）：两屏——选择商家 → 小票（确认页）。 */
export function TransactionStepFlow(props: TransactionStepFlowProps) {
  return props.open ? (
    <BackLayerScope level={transactionBackLayerLevels.flow}>
      <TransactionStepFlowContent {...props} />
    </BackLayerScope>
  ) : null;
}
function TransactionStepFlowContent(input: TransactionStepFlowProps) {
  const creation = useReceiptCreation();
  const props = {
    ...input,
    merchants: mergeReceiptOptions(input.merchants, creation?.merchants),
    accounts: mergeReceiptOptions(input.accounts, creation?.accounts),
  };
  const w = useTransactionStepFlow(props);
  const receipt = w.screen === "receipt";
  return (
    <BackLayerScope level={transactionBackLayerLevels.receiptEditor}>
      <WizardDialog
        open={props.open}
        disableEnterTransition
        disabled={w.saving}
        onClose={() => void w.requestClose()}
        closeLabel={m.close}
        title={receipt ? m.title : m.merchantTitle}
        titleAction={
          !receipt && (
            <Button size="small" onClick={() => w.setMethodOpen(true)}>
              {m.switchMethod}
            </Button>
          )
        }
      >
        <DialogContent
          sx={{ p: 2.5, display: "flex", flexDirection: "column" }}
        >
          {receipt ? (
            <TransactionConfirmStep
              {...w.itemsOptions}
              formId={w.formId}
              form={w.form}
              showAutomaticNotice={w.showAutomaticNotice}
              amountItemId={w.amountItemId}
              onAmountItemChange={w.setAmountItemId}
              accountOptions={props.accounts}
              suggestions={w.suggestions}
              merchantHasHistory={w.merchantHasHistory}
              action={w.saveAction}
              onValidationFailed={w.onValidationFailed}
              errorMessage={w.saveState.error}
              successMessage={w.saveState.success}
              saving={w.saving}
              onMerchantClick={w.merchantPicker.openPicker}
              onAccountSelect={props.onAccountSelect}
            />
          ) : (
            <MerchantStep
              merchants={props.merchants}
              merchantTags={props.merchantTags}
              frequentMerchants={props.frequentMerchants}
              loadingMerchantId={w.loadingMerchantId}
              onSelect={w.merchantPicker.selectMerchant}
              onAddMerchant={w.merchantPicker.onAddMerchant}
              onAddPresets={props.onAddPresets}
            />
          )}
        </DialogContent>
      </WizardDialog>
      <ReceiptMerchantDrawer
        picker={w.merchantPicker}
        merchants={props.merchants}
        merchantTags={props.merchantTags}
        frequentMerchants={props.frequentMerchants}
        onAddPresets={props.onAddPresets}
      />
      <EntryMethodDrawer
        currentMethod="merchant"
        open={w.methodOpen}
        onClose={() => w.setMethodOpen(false)}
        onMethodChange={props.onMethodChange}
      />
      <UnsavedChangesDialog {...w.dialogProps} />
    </BackLayerScope>
  );
}
