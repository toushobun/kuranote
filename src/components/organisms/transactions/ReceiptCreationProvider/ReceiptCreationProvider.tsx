"use client";
import { createContext, useContext, type ReactNode } from "react";
import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import { BottomSlideTransition } from "molecules/ui/BottomSlideTransition";
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
      <Dialog
        open={!!w.editor}
        aria-labelledby="receipt-creation-title"
        fullScreen
        onClose={w.close}
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
            onClick={w.close}
          >
            <CloseRoundedIcon />
          </IconButton>
          {w.editor?.type === "merchant" ? m.addMerchant : m.addAccount}
        </DialogTitle>
        <DialogContent sx={{ bgcolor: "background.default", p: 2.5 }}>
          {data && w.editor?.type === "merchant" && (
            <MerchantCreateBody
              {...data.merchant}
              createMerchantAction={w.trackAction(
                data.merchant.createMerchantAction,
              )}
              initialName={w.editor.name}
              onCancel={w.close}
              onCreated={w.merchantCreated}
            />
          )}
          {data && w.editor?.type === "account" && (
            <AccountCreateBody
              {...data.account}
              createAccountAction={w.trackAction(
                data.account.createAccountAction,
              )}
              onCancel={w.close}
              onCreated={w.accountCreated}
            />
          )}
        </DialogContent>
      </Dialog>
      <Snackbar
        open={!!w.message}
        autoHideDuration={5000}
        onClose={w.clearMessage}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity="success" onClose={w.clearMessage}>
          {w.message}
        </Alert>
      </Snackbar>
    </ReceiptCreationContext.Provider>
  );
}
