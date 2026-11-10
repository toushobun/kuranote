import { designTokens } from "theme/theme";

import { receiptIconSize } from "../TransactionConfirmStep/ReceiptLine";

// 小票各区块共用的样式（普通记录、账户周转、余额调整，#1050）。
export const receiptSectionSx = {
  borderTop: "1px dashed",
  borderColor: "divider",
  py: 1,
  outline: "none",
};
export const receiptSectionTitleSx = {
  color: "text.secondary",
  display: "block",
  fontWeight: 700,
  pt: 0.5,
};
export const receiptErrorTextSx = { color: "error.main" };
export const receiptMutedTextSx = { color: "text.secondary" };
export const receiptPencilSx = {
  color: "text.disabled",
  flexShrink: 0,
  fontSize: receiptIconSize,
};
export const receiptHeaderButtonSx = {
  display: "inline-flex",
  alignItems: "center",
  gap: 0.5,
  maxWidth: "100%",
  minHeight: 32,
  px: 0.5,
  borderRadius: `${designTokens.radius.sm}px`,
  color: "text.primary",
  "& .MuiTypography-root": {
    minWidth: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
};
