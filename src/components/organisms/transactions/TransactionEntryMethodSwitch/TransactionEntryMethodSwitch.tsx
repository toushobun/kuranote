"use client";
import Button from "@mui/material/Button";
import { useState } from "react";
import { flowMessages as m } from "config/transactionStepFlowMessages";
import { EntryMethodDrawer } from "organisms/transactions/EntryMethodDrawer/EntryMethodDrawer";
import type { TransactionEntryMethod } from "types/transactions";
import { useTransactionEntryMethodChange } from "./useTransactionEntryMethodChange";

/** 账户周转、标准记账页面顶部的「切换方式」按钮与方式选择抽屉。 */
export function TransactionEntryMethodSwitch({
  currentMethod,
}: {
  currentMethod: TransactionEntryMethod;
}) {
  const [open, setOpen] = useState(false);
  const changeMethod = useTransactionEntryMethodChange();
  return (
    <>
      <Button size="small" onClick={() => setOpen(true)}>
        {m.switchMethod}
      </Button>
      <EntryMethodDrawer
        currentMethod={currentMethod}
        open={open}
        onClose={() => setOpen(false)}
        onMethodChange={changeMethod}
      />
    </>
  );
}
