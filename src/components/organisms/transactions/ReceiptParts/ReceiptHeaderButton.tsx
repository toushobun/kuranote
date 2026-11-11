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
  above,
  onClick,
  error = false,
  readOnly = false,
}: {
  label: string;
  value: string;
  children: ReactNode;
  above?: ReactNode;
  onClick: () => void;
  error?: boolean;
  readOnly?: boolean;
}) {
  if (readOnly) return <Box sx={receiptHeaderButtonSx}>{children}</Box>;
  const content = (
    <>
      {children}
      <EditOutlinedIcon aria-hidden sx={receiptPencilSx} />
    </>
  );
  return (
    <ButtonBase
      aria-label={m.editReceiptRow(label, value)}
      onClick={onClick}
      data-invalid={error || undefined}
      sx={[
        receiptHeaderButtonSx,
        Boolean(above) && { flexDirection: "column" },
        error && {
          color: "error.main",
          "& .MuiTypography-root": receiptErrorTextSx,
        },
      ]}
    >
      {above}
      {above ? (
        <Box component="span" sx={receiptHeaderButtonSx}>
          {content}
        </Box>
      ) : (
        content
      )}
    </ButtonBase>
  );
}
