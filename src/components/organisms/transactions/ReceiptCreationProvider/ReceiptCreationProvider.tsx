"use client";
import {
  createContext,
  useContext,
  useId,
  useState,
  type ReactNode,
} from "react";
import {
  BackLayerScope,
  transactionBackLayerLevels,
  useBackLayerLevel,
} from "molecules/ui/UnsavedChangesDialog/BackLayerScope";
import { useUnsavedChangesGuard } from "molecules/ui/UnsavedChangesDialog/useUnsavedChangesGuard";
import { UnsavedChangesDialog } from "molecules/ui/UnsavedChangesDialog/UnsavedChangesDialog";
import { appZIndex } from "theme/zIndex";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import { BottomSlideTransition } from "molecules/ui/BottomSlideTransition";
import { SuccessFeedbackDialog } from "molecules/ui/OperationFeedbackDialogs";
import { bottomNavigationLayout } from "organisms/navigation/bottomNavigationLayout";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import {
  MerchantCreateBody,
  type MerchantCreateTemplateProps,
} from "templates/merchants/MerchantCreate";
import {
  AccountCreateBody,
  type AccountCreateTemplateProps,
} from "templates/accounts/AccountCreate";
import { flowMessages as m } from "config/transactionStepFlowMessages";
import { useReceiptCreationState } from "./useReceiptCreationState";

export type ReceiptCreationData = {
  merchant: MerchantCreateTemplateProps;
  account: AccountCreateTemplateProps;
} | null;
const ReceiptCreationContext = createContext<ReturnType<
  typeof useReceiptCreationState
> | null>(null);
export function useReceiptCreation() {
  return useContext(ReceiptCreationContext);
}

/** 弹层独立于小票表单，关闭时只卸载新增主体。 */
export function ReceiptCreationProvider({
  children,
  data,
}: {
  children: ReactNode;
  data: ReceiptCreationData;
}) {
  const w = useReceiptCreationState(data);
  return (
    <ReceiptCreationContext.Provider value={w}>
      {children}
      {w.editor && (
        <BackLayerScope
          level={
            w.editor.navigation ? transactionBackLayerLevels.creation : null
          }
        >
          <ReceiptCreationEditor w={w} data={data} />
        </BackLayerScope>
      )}
      <SuccessFeedbackDialog
        aboveModal
        bottomOffset={bottomNavigationLayout.feedbackBottomOffset}
        open={!!w.message}
        onClose={w.clearMessage}
        title={w.message}
      />
    </ReceiptCreationContext.Provider>
  );
}

function ReceiptCreationEditor({
  w,
  data,
}: {
  w: ReturnType<typeof useReceiptCreationState>;
  data: ReceiptCreationData;
}) {
  const [dirty, setDirty] = useState(false);
  const formId = useId();
  const level = useBackLayerLevel();
  const guard = useUnsavedChangesGuard({
    isDirty: dirty,
    saveFormId: formId,
    onClose: w.close,
    layer: level,
    active: level !== null,
    disabled: w.pending,
  });
  const close = level !== null ? guard.requestClose : w.close;
  return (
    <>
      <BackLayerScope level={level === null ? null : level + 1}>
        <Dialog
          open={!!w.editor}
          aria-labelledby="receipt-creation-title"
          fullScreen
          sx={{ zIndex: appZIndex.dropdown }}
          onClose={close}
          slots={{ transition: BottomSlideTransition }}
        >
          <DialogTitle
            id="receipt-creation-title"
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              pt: "calc(16px + env(safe-area-inset-top))",
            }}
          >
            <IconButton
              aria-label={m.creationClose}
              disabled={w.pending}
              onClick={close}
            >
              <CloseRoundedIcon />
            </IconButton>
            {w.editor?.type === "merchant" ? m.addMerchant : m.addAccount}
          </DialogTitle>
          <DialogContent sx={{ bgcolor: "background.default", p: 2.5 }}>
            {data && w.editor?.type === "merchant" && (
              <MerchantCreateBody
                {...data.merchant}
                formId={formId}
                onDirtyChange={setDirty}
                createMerchantAction={w.trackAction((state, dataValue) =>
                  guard.runAction(() =>
                    data.merchant.createMerchantAction(state, dataValue),
                  ),
                )}
                initialName={w.editor.name}
                onCancel={close}
                onCreated={w.merchantCreated}
              />
            )}
            {data && w.editor?.type === "account" && (
              <AccountCreateBody
                {...data.account}
                formId={formId}
                onDirtyChange={setDirty}
                createAccountAction={w.trackAction((state, dataValue) =>
                  guard.runAction(() =>
                    data.account.createAccountAction(state, dataValue),
                  ),
                )}
                onCancel={close}
                onCreated={w.accountCreated}
              />
            )}
          </DialogContent>
        </Dialog>
      </BackLayerScope>
      <UnsavedChangesDialog {...guard.dialogProps} />
    </>
  );
}
