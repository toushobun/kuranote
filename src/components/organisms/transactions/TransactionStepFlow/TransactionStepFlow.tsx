"use client";
import { TransactionItemsStep } from "organisms/transactions/TransactionItemsStep/TransactionItemsStep";
import type { ItemsStepOptions } from "organisms/transactions/TransactionItemsStep/TransactionItemsStep.types";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import DialogContent from "@mui/material/DialogContent";
import Typography from "@mui/material/Typography";
import { WizardDialog } from "molecules/ui/WizardDialog/WizardDialog";
import { StepProgress } from "molecules/ui/StepProgress/StepProgress";
import { MerchantStep } from "organisms/transactions/MerchantStep/MerchantStep";
import { AccountStep } from "organisms/transactions/AccountStep/AccountStep";
import { EntryMethodDrawer } from "organisms/transactions/EntryMethodDrawer/EntryMethodDrawer";
import { MerchantAccountSummaryCard } from "organisms/transactions/MerchantAccountSummaryCard/MerchantAccountSummaryCard";
import { flowMessages as m } from "config/transactionStepFlowMessages";
import type { TransactionStepFlowProps } from "./TransactionStepFlow.types";
import { useTransactionStepFlow } from "./useTransactionStepFlow";

const emptyItemsOptions: ItemsStepOptions = { categoryOptions: [] };

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
              clickableSteps={[...w.completed, 4]}
              onStepClick={w.goToStep}
            />
            {w.step >= 2 && w.merchant && (
              <MerchantAccountSummaryCard
                merchant={w.merchant}
                account={
                  w.itemsSnapshot && w.itemsSnapshot.payments.length > 1
                    ? props.accounts.find(
                        (account) =>
                          account.id ===
                          w.itemsSnapshot?.payments[0]?.accountId,
                      )
                    : w.account
                }
                paymentAccountCount={w.itemsSnapshot?.payments.length ?? 1}
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
              recommendedAccountIds={props.suggestions?.recommendedAccountIds}
              selectedAccount={w.account}
              hasDetails={props.hasDetails || !!w.itemsSnapshot?.items.length}
              onSelect={w.selectAccount}
              onAddAccount={props.onAddAccount}
            />
          )}
          {w.itemsStarted && (
            <Box
              hidden={w.step !== 3}
              sx={{
                display: w.step === 3 ? "flex" : "none",
                flex: 1,
                flexDirection: "column",
              }}
            >
              <TransactionItemsStep
                {...(props.itemsOptions ?? emptyItemsOptions)}
                accountOptions={props.accounts}
                selectedAccount={w.account}
                suggestions={props.suggestions}
                returning={w.returning}
                onConfirm={() => w.advance(3)}
                onChange={w.updateItemsSnapshot}
              />
            </Box>
          )}
          {w.step === 4 && <Typography>{m.confirmPlaceholder}</Typography>}
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
        open={w.methodOpen}
        onClose={() => w.setMethodOpen(false)}
        onMethodChange={props.onMethodChange}
      />
    </>
  );
}
