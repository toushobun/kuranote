"use client";
import { TransactionItemsStep } from "organisms/transactions/TransactionItemsStep/TransactionItemsStep";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import DialogContent from "@mui/material/DialogContent";
import { TransactionConfirmStep } from "../TransactionConfirmStep/TransactionConfirmStep";
import { WizardDialog } from "molecules/ui/WizardDialog/WizardDialog";
import { StepProgress } from "molecules/ui/StepProgress/StepProgress";
import { MerchantStep } from "organisms/transactions/MerchantStep/MerchantStep";
import { AccountStep } from "organisms/transactions/AccountStep/AccountStep";
import { EntryMethodDrawer } from "organisms/transactions/EntryMethodDrawer/EntryMethodDrawer";
import { MerchantAccountSummaryCard } from "organisms/transactions/MerchantAccountSummaryCard/MerchantAccountSummaryCard";
import { flowMessages as m } from "config/transactionStepFlowMessages";
import type { TransactionStepFlowProps } from "./TransactionStepFlow.types";
import { useTransactionStepFlow } from "./useTransactionStepFlow";

export function TransactionStepFlow(props: TransactionStepFlowProps) {
  return props.open ? <TransactionStepFlowSession {...props} /> : null;
}
function TransactionStepFlowSession(props: TransactionStepFlowProps) {
  const w = useTransactionStepFlow(props);
  return (
    <>
      <WizardDialog
        open={props.open}
        onClose={() => void w.requestClose()}
        closeLabel={m.close}
        title={m.title}
        titleAction={
          <Button size="small" onClick={() => w.setMethodOpen(true)}>
            {m.switchMethod}
          </Button>
        }
        headerContent={
          <>
            <StepProgress
              currentStep={w.step}
              steps={m.steps}
              label={m.progress}
              completedSteps={w.completed}
              clickableSteps={w.clickableSteps}
              onStepClick={w.goToStep}
            />
            {w.step >= 2 && w.merchant && (
              <MerchantAccountSummaryCard
                merchant={w.merchant}
                account={w.account}
                paymentAccountCount={w.form.payments.length}
                onMerchantChange={() => w.goToStep(1)}
                onAccountChange={() => w.goToStep(2)}
              />
            )}
          </>
        }
      >
        <DialogContent
          sx={{ p: 2.5, display: "flex", flexDirection: "column" }}
        >
          {w.step === 1 && (
            <MerchantStep
              merchants={props.merchants}
              merchantTags={props.merchantTags}
              frequentMerchants={props.frequentMerchants}
              onSelect={w.selectMerchant}
              onAddMerchant={props.onAddMerchant}
              onAddPresets={props.onAddPresets}
            />
          )}
          {w.step === 2 && (
            <AccountStep
              accounts={props.accounts}
              recommendedAccountIds={w.suggestions?.recommendedAccountIds}
              selectedAccount={w.account}
              hasDetails={props.hasDetails || !!w.form.itemSummaries.length}
              onSelect={w.selectAccount}
              onAddAccount={props.onAddAccount}
            />
          )}
          {w.step === 3 && (
            <TransactionItemsStep
              {...w.itemsOptions}
              form={w.form}
              automaticItemIds={w.automaticItemIds}
              amountItemId={w.amountItemId}
              onAmountItemChange={w.setAmountItemId}
              accountOptions={props.accounts}
              suggestions={w.suggestions}
              merchantHasHistory={w.merchantHasHistory}
              returning={w.returning}
              onConfirm={() => w.advance(3)}
            />
          )}
          {w.step === 4 && (
            <TransactionConfirmStep
              {...w.itemsOptions}
              form={w.form}
              automaticItemIds={w.automaticItemIds}
              amountItemId={w.amountItemId}
              onAmountItemChange={w.setAmountItemId}
              accountOptions={props.accounts}
              suggestions={w.suggestions}
              onConfirm={() => w.advance(3)}
              action={w.saveAction}
              errorMessage={w.saveState.error}
              successMessage={w.saveState.success}
              saving={w.saving}
              goToStep={w.goToStep}
            />
          )}
        </DialogContent>
        {w.returning && w.step !== 3 && (
          <Box sx={{ p: 2, pb: "max(16px, env(safe-area-inset-bottom))" }}>
            <Button
              fullWidth
              variant="contained"
              disabled={
                (w.step === 1 && !w.merchant) || (w.step === 2 && !w.account)
              }
              onClick={() => w.advance(w.step)}
            >
              {w.returning ? m.returnToConfirm : m.toConfirm}
            </Button>
          </Box>
        )}
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
