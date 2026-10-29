"use client";
import Button from "@mui/material/Button";
import DialogContent from "@mui/material/DialogContent";
import { TransactionConfirmStep } from "../TransactionConfirmStep/TransactionConfirmStep";
import { WizardDialog } from "molecules/ui/WizardDialog/WizardDialog";
import { MerchantStep } from "organisms/transactions/MerchantStep/MerchantStep";
import { EntryMethodDrawer } from "organisms/transactions/EntryMethodDrawer/EntryMethodDrawer";
import { flowMessages as m } from "config/transactionStepFlowMessages";
import type { TransactionStepFlowProps } from "./TransactionStepFlow.types";
import { useTransactionStepFlow } from "./useTransactionStepFlow";

/** 从商家记账（#943 任务 9）：两屏——选择商家 → 小票（确认页）。 */
export function TransactionStepFlow(props: TransactionStepFlowProps) {
  return props.open ? <TransactionStepFlowSession {...props} /> : null;
}
function TransactionStepFlowSession(props: TransactionStepFlowProps) {
  const w = useTransactionStepFlow(props);
  const receipt = w.screen === "receipt";
  return (
    <>
      <WizardDialog
        open={props.open}
        disableEnterTransition
        onClose={() => void w.requestClose()}
        closeLabel={m.close}
        title={receipt ? m.title : m.merchantTitle}
        back={
          receipt
            ? { label: m.backToMerchant, onClick: w.backToMerchant }
            : undefined
        }
        titleAction={
          <Button size="small" onClick={() => w.setMethodOpen(true)}>
            {m.switchMethod}
          </Button>
        }
      >
        <DialogContent
          sx={{ p: 2.5, display: "flex", flexDirection: "column" }}
        >
          {receipt ? (
            <TransactionConfirmStep
              {...w.itemsOptions}
              form={w.form}
              automaticItemIds={w.automaticItemIds}
              amountItemId={w.amountItemId}
              onAmountItemChange={w.setAmountItemId}
              accountOptions={props.accounts}
              suggestions={w.suggestions}
              merchantHasHistory={w.merchantHasHistory}
              action={w.saveAction}
              errorMessage={w.saveState.error}
              successMessage={w.saveState.success}
              saving={w.saving}
              onBack={w.backToMerchant}
              onAccountSelect={props.onAccountSelect}
              onAddAccount={props.onAddAccount}
            />
          ) : (
            <MerchantStep
              merchants={props.merchants}
              merchantTags={props.merchantTags}
              frequentMerchants={props.frequentMerchants}
              loadingMerchantId={w.loadingMerchantId}
              onSelect={w.selectMerchant}
              onAddMerchant={props.onAddMerchant}
              onAddPresets={props.onAddPresets}
            />
          )}
        </DialogContent>
      </WizardDialog>
      <EntryMethodDrawer
        currentMethod="merchant"
        open={w.methodOpen}
        onClose={() => w.setMethodOpen(false)}
        onMethodChange={props.onMethodChange}
      />
    </>
  );
}
