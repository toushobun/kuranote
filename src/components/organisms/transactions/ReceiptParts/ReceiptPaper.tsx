import Box from "@mui/material/Box";
import type { ReactNode } from "react";

import {
  receiptPaperSx,
  receiptShadowSx,
} from "../TransactionConfirmStep/receiptPaperStyles";

/** 小票纸片：上下锯齿边，阴影沿纸片轮廓绘制。 */
export function ReceiptPaper({ children }: { children: ReactNode }) {
  return (
    <Box sx={receiptShadowSx}>
      <Box sx={receiptPaperSx}>{children}</Box>
    </Box>
  );
}
