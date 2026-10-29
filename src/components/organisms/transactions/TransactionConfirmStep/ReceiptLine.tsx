"use client";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";
import { designTokens } from "theme/theme";

/**
 * 小票中的明细行 / 支付行（设计图 8）：图标、名称与标签、金额，右侧依次为铅笔与删除 ×。
 * 明细与支付样式统一；没有可删除的内容时 × 位置留空，保持各行铅笔对齐。
 */
export function ReceiptLine({
  icon,
  label,
  tags,
  amount,
  error = false,
  errorLabel = error,
  editLabel,
  onEdit,
  removeLabel,
  onRemove,
}: {
  icon: ReactNode;
  label: string;
  tags?: ReactNode;
  amount?: ReactNode;
  error?: boolean;
  /** 名称是否标红；默认与 `error` 一致，只缺金额时由金额的「待输入」提示。 */
  errorLabel?: boolean;
  editLabel: string;
  onEdit: () => void;
  removeLabel?: string;
  onRemove?: () => void;
}) {
  return (
    <Box data-invalid={error || undefined} sx={lineSx}>
      <Box aria-hidden sx={[iconSx, errorLabel && errorTextSx]}>
        {icon}
      </Box>
      <Box sx={labelBoxSx}>
        <Typography
          variant="body2"
          noWrap
          sx={[{ minWidth: 0 }, errorLabel && errorTextSx]}
        >
          {label}
        </Typography>
        {tags}
      </Box>
      {amount}
      <IconButton
        size="small"
        aria-label={editLabel}
        onClick={onEdit}
        sx={actionSx}
      >
        <EditOutlinedIcon sx={{ fontSize: receiptIconSize }} />
      </IconButton>
      {onRemove && removeLabel ? (
        <IconButton
          size="small"
          aria-label={removeLabel}
          onClick={onRemove}
          sx={actionSx}
        >
          <CloseRoundedIcon sx={{ fontSize: receiptIconSize }} />
        </IconButton>
      ) : (
        <Box sx={{ width: actionSize }} />
      )}
    </Box>
  );
}

/**
 * 小票中可点击的金额：统一带「待输入」那样的下划线，点击只打开金额键盘。
 * `pending`（金额未填）时显示为强调色。
 */
export function ReceiptAmountButton({
  label,
  amount,
  pending = false,
  income = false,
  onClick,
}: {
  label: string;
  amount: string;
  pending?: boolean;
  income?: boolean;
  onClick: () => void;
}) {
  return (
    <ButtonBase
      aria-label={label}
      onClick={onClick}
      sx={[
        amountButtonSx,
        income && { color: "success.main" },
        pending && { color: "error.main" },
      ]}
    >
      {amount}
    </ButtonBase>
  );
}

/** 小票中不可点击的金额（单账户的支付金额由明细推导）。 */
export function ReceiptAmountText({ amount }: { amount: string }) {
  return (
    <Typography variant="body2" sx={amountTextSx}>
      {amount}
    </Typography>
  );
}

export const receiptIconSize = 18;
const actionSize = 32;
const errorTextSx = { color: "error.main" };
const lineSx = {
  display: "flex",
  alignItems: "center",
  gap: 1,
  minHeight: 40,
};
const iconSx = {
  display: "inline-flex",
  flexShrink: 0,
  color: "primary.main",
  fontSize: 18,
  width: 20,
  justifyContent: "center",
};
const labelBoxSx = {
  display: "flex",
  alignItems: "center",
  gap: 0.75,
  flex: 1,
  minWidth: 0,
  "& .MuiChip-root": { flexShrink: 0 },
};
const actionSx = {
  color: "text.disabled",
  flexShrink: 0,
  height: actionSize,
  width: actionSize,
};
const amountTextSx = {
  flexShrink: 0,
  fontWeight: 700,
  fontVariantNumeric: "tabular-nums",
};
const amountButtonSx = {
  ...amountTextSx,
  typography: "body2",
  fontWeight: 700,
  color: "text.primary",
  textDecoration: "underline",
  textDecorationThickness: 1,
  textUnderlineOffset: 4,
  borderRadius: `${designTokens.radius.sm}px`,
  px: 0.25,
  minHeight: 32,
  "&.Mui-focusVisible": { outline: "2px solid", outlineColor: "primary.main" },
};
