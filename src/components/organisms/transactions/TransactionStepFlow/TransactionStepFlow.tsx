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
import { useWizardDialogSwitchPane } from "molecules/ui/WizardDialog/wizardDialogSwitchContext";
import { EntryMethodDrawer } from "organisms/transactions/EntryMethodDrawer/EntryMethodDrawer";
import { flowMessages as m } from "config/transactionStepFlowMessages";
import type { TransactionStepFlowProps } from "./TransactionStepFlow.types";
import { useTransactionStepFlow } from "./useTransactionStepFlow";

/** 从商家记账：直接在小票内选择商家和填写。 */
export function TransactionStepFlow(props: TransactionStepFlowProps) {
  const active = useWizardDialogSwitchPane()?.active ?? true;
  return props.open ? (
    <BackLayerScope level={active ? transactionBackLayerLevels.flow : null}>
      <TransactionStepFlowContent {...props} active={active} />
    </BackLayerScope>
  ) : null;
}
function TransactionStepFlowContent(
  input: TransactionStepFlowProps & { active: boolean },
) {
  const creation = useReceiptCreation();
  const props = {
    ...input,
    merchants: mergeReceiptOptions(input.merchants, creation?.merchants),
    accounts: mergeReceiptOptions(input.accounts, creation?.accounts),
  };
  const w = useTransactionStepFlow(props);
  return (
    <BackLayerScope
      level={props.active ? transactionBackLayerLevels.receiptEditor : null}
    >
      <WizardDialog
        open={props.open}
        disableEnterTransition
        disabled={w.saving}
        onClose={() => void w.requestClose()}
        closeLabel={m.close}
        title={m.title}
        titleAction={
          <Button
            size="small"
            disabled={w.saving}
            onClick={() => w.setMethodOpen(true)}
          >
            {m.switchMethod}
          </Button>
        }
      >
        <DialogContent
          sx={{ p: 2.5, display: "flex", flexDirection: "column" }}
        >
          <TransactionConfirmStep
            {...w.itemsOptions}
            formId={w.formId}
            form={w.form}
            showAutomaticNotice={w.showAutomaticNotice}
            amountItemId={w.amountItemId}
            onAmountItemChange={w.setAmountItemId}
            accountOptions={props.accounts}
            suggestions={w.suggestions}
            action={w.saveAction}
            onValidationFailed={w.onValidationFailed}
            errorMessage={w.saveState.error}
            successMessage={w.saveState.success}
            saving={w.saving}
            suggestionsLoading={w.waiting}
            onMerchantClick={w.merchantPicker.openPicker}
            onAccountSelect={props.onAccountSelect}
          />
        </DialogContent>
      </WizardDialog>
      <ReceiptMerchantDrawer
        picker={{
          ...w.merchantPicker,
          open: props.active && w.merchantPicker.open,
          suspended:
            w.merchantPicker.suspended || !!props.merchantPickerSuspended,
        }}
        merchants={props.merchants}
        merchantTags={props.merchantTags}
        frequentMerchants={props.frequentMerchants}
        onAddPresets={props.onAddPresets}
      />
      <EntryMethodDrawer
        currentMethod="merchant"
        open={props.active && w.methodOpen}
        onClose={() => w.setMethodOpen(false)}
        onMethodChange={props.onMethodChange}
      />
      <UnsavedChangesDialog {...w.dialogProps} />
    </BackLayerScope>
  );
}
