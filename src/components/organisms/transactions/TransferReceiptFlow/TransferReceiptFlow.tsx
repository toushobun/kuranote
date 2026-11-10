"use client";
import Button from "@mui/material/Button";
import DialogContent from "@mui/material/DialogContent";
import { useActionState, useState } from "react";

import { flowMessages as m } from "config/transactionStepFlowMessages";
import {
  BackLayerScope,
  transactionBackLayerLevels,
} from "molecules/ui/UnsavedChangesDialog/BackLayerScope";
import { UnsavedChangesDialog } from "molecules/ui/UnsavedChangesDialog/UnsavedChangesDialog";
import { useUnsavedChangesGuard } from "molecules/ui/UnsavedChangesDialog/useUnsavedChangesGuard";
import { WizardDialog } from "molecules/ui/WizardDialog/WizardDialog";
import { EditTransactionDirtyProvider } from "organisms/transactions/EditTransactionDirtyContext/EditTransactionDirtyContext";
import { EntryMethodDrawer } from "organisms/transactions/EntryMethodDrawer/EntryMethodDrawer";
import { useReceiptCreation } from "organisms/transactions/ReceiptCreationProvider/ReceiptCreationProvider";
import { mergeReceiptOptions } from "organisms/transactions/ReceiptCreationProvider/useReceiptCreationState";
import { TransferReceipt } from "organisms/transactions/TransferReceipt/TransferReceipt";
import type { ActionState } from "types/actions";
import type {
  TransactionAccountOption,
  TransactionEntryMethod,
} from "types/transactions";

const transferFormId = "new-transfer-transaction-form";

type TransferReceiptFlowProps = {
  accounts: TransactionAccountOption[];
  action: (state: ActionState, data: FormData) => Promise<ActionState>;
  onClose: () => void;
  onMethodChange: (method: TransactionEntryMethod) => void;
};

/**
 * 记账方式「账户周转」（#1050）：与从商家记账同一个全屏外框（✕、标题、切换方式），
 * 内容是转账小票；动过小票后关闭或切换方式都要确认。
 */
export function TransferReceiptFlow(props: TransferReceiptFlowProps) {
  return (
    <BackLayerScope level={transactionBackLayerLevels.flow}>
      <TransferReceiptFlowContent {...props} />
    </BackLayerScope>
  );
}

function TransferReceiptFlowContent(props: TransferReceiptFlowProps) {
  const creation = useReceiptCreation();
  const accounts = mergeReceiptOptions(props.accounts, creation?.accounts);
  const [dirty, setDirty] = useState(false);
  const guard = useUnsavedChangesGuard({
    isDirty: dirty,
    saveFormId: transferFormId,
    onClose: props.onClose,
  });
  const [saveState, saveAction, saving] = useActionState<ActionState, FormData>(
    (state, data) =>
      guard.runSaveAction(data, (values) => props.action(state, values)),
    {},
  );
  const [methodOpen, setMethodOpen] = useState(false);
  return (
    <BackLayerScope level={transactionBackLayerLevels.receiptEditor}>
      <EditTransactionDirtyProvider onDirty={setDirty}>
        <WizardDialog
          open
          disableEnterTransition
          disabled={saving}
          onClose={guard.requestClose}
          closeLabel={m.close}
          title={m.transferTitle}
          titleAction={
            <Button size="small" onClick={() => setMethodOpen(true)}>
              {m.switchMethod}
            </Button>
          }
        >
          <DialogContent
            sx={{ p: 2.5, display: "flex", flexDirection: "column" }}
          >
            <TransferReceipt
              formId={transferFormId}
              action={saveAction}
              accountOptions={accounts}
              errorMessage={saveState.error}
              saving={saving}
              onValidationFailed={guard.cancelSave}
            />
          </DialogContent>
        </WizardDialog>
      </EditTransactionDirtyProvider>
      <EntryMethodDrawer
        currentMethod="transfer"
        open={methodOpen}
        onClose={() => setMethodOpen(false)}
        onMethodChange={props.onMethodChange}
        requestNavigate={guard.requestNavigate}
      />
      <UnsavedChangesDialog {...guard.dialogProps} />
    </BackLayerScope>
  );
}
