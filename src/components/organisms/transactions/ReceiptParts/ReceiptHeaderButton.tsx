"use client";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import type { ReactNode } from "react";

import { flowMessages as m } from "config/transactionStepFlowMessages";

import {
  receiptErrorTextSx,
  receiptHeaderButtonSx,
  receiptPencilSx,
} from "./receiptStyles";

/** 抬头中可点击的一行（商家名、日期时间）：铅笔紧跟在文字右侧（设计图 8）。 */
export function ReceiptHeaderButton({
  label,
  value,
  children,
  onClick,
  error = false,
  readOnly = false,
}: {
  label: string;
  value: string;
  children: ReactNode;
  onClick: () => void;
  error?: boolean;
  readOnly?: boolean;
}) {
  if (readOnly) return <Box sx={receiptHeaderButtonSx}>{children}</Box>;
  return (
    <ButtonBase
      aria-label={m.editReceiptRow(label, value)}
      onClick={onClick}
      data-invalid={error || undefined}
      sx={[
        receiptHeaderButtonSx,
        error && {
          color: "error.main",
          "& .MuiTypography-root": receiptErrorTextSx,
        },
      ]}
    >
      {children}
      <EditOutlinedIcon aria-hidden sx={receiptPencilSx} />
    </ButtonBase>
  );
}
