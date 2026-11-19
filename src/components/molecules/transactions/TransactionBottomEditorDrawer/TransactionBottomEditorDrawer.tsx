"use client";

import Button from "@mui/material/Button";
import { type ReactNode } from "react";

import { transactionBottomEditorDrawerMessages as m } from "config/transactionMessages";
import { BottomEditorDrawer } from "molecules/ui/BottomEditorDrawer/BottomEditorDrawer";
import { amountKeypadZIndex } from "theme/zIndex";

export function TransactionBottomEditorDrawer({
  open,
  suspended = false,
  title,
  onClose,
  children,
}: {
  open: boolean;
  /** 上层新增弹层打开时隐藏抽屉但保留选择组件，关闭后恢复。 */
  suspended?: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <BottomEditorDrawer
      closeLabel={m.close(title)}
      footer={
        <Button variant="contained" fullWidth onClick={onClose}>
          {m.done}
        </Button>
      }
      onClose={onClose}
      open={open}
      suspended={suspended}
      title={title}
      zIndex={amountKeypadZIndex}
    >
      {children}
    </BottomEditorDrawer>
  );
}
