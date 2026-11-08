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
 * 小票中的明细行 / 支付行：名称旁的铅笔编辑明细或账户，金额按钮内的铅笔编辑金额。
 * 没有可删除的内容时 × 位置留空，保持行尾对齐。
 * `subline`（明细的业务状态标签等）显示在名称下面一行。
 */
export function ReceiptLine({
  icon,
  label,
  truncateLabel = false,
  compact = false,
  tags,
  subline,
  amount,
  error = false,
  errorLabel = error,
  labelClickable = false,
  editLabel,
  onEdit,
  removeLabel,
  onRemove,
}: {
  icon?: ReactNode;
  label: string;
  truncateLabel?: boolean;
  /**
   * 分组明细用：行高收紧到操作按钮高度，次排下方补上与首排文字相同的留白，
   * 让上下文字边缘之间的空隙由外层统一控制（#1022 样式 ④）。
   */
  compact?: boolean;
  tags?: ReactNode;
  subline?: ReactNode;
  amount?: ReactNode;
  error?: boolean;
  /** 名称是否标红；默认与 `error` 一致，只缺金额时由金额的「待输入」提示。 */
  errorLabel?: boolean;
  /** 名称本身也可点击，与铅笔同样调用 `onEdit`（如未选账户时的「选择收支账户」）。 */
  labelClickable?: boolean;
  /** 不传时（只读）不显示铅笔与 × 的位置。 */
  editLabel?: string;
  onEdit?: () => void;
  removeLabel?: string;
  onRemove?: () => void;
}) {
  const editButton = onEdit && editLabel && (
    <IconButton
      size="small"
      aria-label={editLabel}
      onClick={onEdit}
      sx={actionSx}
    >
      <EditOutlinedIcon sx={pencilSx} />
    </IconButton>
  );
  const primaryLabel = (
    <Typography
      variant="body2"
      noWrap={truncateLabel || !!icon}
      component={labelClickable ? ButtonBase : "p"}
      onClick={labelClickable ? onEdit : undefined}
      sx={[
        { minWidth: 0 },
        labelClickable && labelButtonSx,
        errorLabel && errorTextSx,
      ]}
    >
      {label}
    </Typography>
  );
  return (
    <Box data-receipt-line data-invalid={error || undefined}>
      <Box sx={[lineSx, compact && { minHeight: actionSize }]}>
        {icon && (
          <Box aria-hidden sx={[iconSx, errorLabel && errorTextSx]}>
            {icon}
          </Box>
        )}
        <Box sx={labelColumnSx}>
          <Box sx={labelBoxSx}>
            {primaryLabel}
            {tags}
            {!labelClickable && editButton}
          </Box>
        </Box>
        {amount}
        {labelClickable && editButton}
        {!onEdit ? null : onRemove && removeLabel ? (
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
      {subline && (
        <Box sx={[sublineSx, compact && compactSublineSx]}>{subline}</Box>
      )}
    </Box>
  );
}

/**
 * 小票中可点击的金额和铅笔共用按钮，点击只打开金额键盘。
 * `pending`（金额未填或需重新输入）时显示为强调色。
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
        income && { color: incomeAmountColor },
        pending && { color: "error.main" },
      ]}
    >
      {amount}
      <EditOutlinedIcon aria-hidden sx={pencilSx} />
    </ButtonBase>
  );
}

/** 小票中不可点击的金额（单账户的支付金额由明细推导；只读时的明细与付款金额）。 */
export function ReceiptAmountText({
  amount,
  income = false,
}: {
  amount: string;
  income?: boolean;
}) {
  return (
    <Typography
      variant="body2"
      sx={[amountTextSx, income && { color: incomeAmountColor }]}
    >
      {amount}
    </Typography>
  );
}

export const receiptIconSize = 18;
// 收支颜色按交易配色设置（与明细列表一致）。
export const expenseAmountColor = "var(--user-theme-negative-amount)";
export const incomeAmountColor = "var(--user-theme-income-amount)";
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
const labelButtonSx = {
  justifyContent: "flex-start",
  borderRadius: `${designTokens.radius.sm}px`,
  minHeight: 32,
  "&.Mui-focusVisible": { outline: "2px solid", outlineColor: "primary.main" },
};
const labelColumnSx = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  gap: 0.25,
  flex: 1,
  minWidth: 0,
};
const labelBoxSx = {
  display: "flex",
  alignItems: "center",
  gap: 0.75,
  maxWidth: "100%",
  minWidth: 0,
  "& .MuiChip-root": { flexShrink: 0 },
};
// 与 32px 行高下首排文字到行盒底部的距离一致。
const compactSublineSx = { pb: 1 };
const sublineSx = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: 0.75,
};
const actionSx = {
  color: "text.disabled",
  flexShrink: 0,
  height: actionSize,
  width: actionSize,
};
const pencilSx = { fontSize: receiptIconSize, color: "text.disabled" };
const amountTextSx = {
  flexShrink: 0,
  whiteSpace: "nowrap",
  fontWeight: 700,
  fontVariantNumeric: "tabular-nums",
};
const amountButtonSx = {
  ...amountTextSx,
  typography: "body2",
  fontWeight: 700,
  color: "text.primary",
  borderRadius: `${designTokens.radius.sm}px`,
  px: 0.25,
  gap: 0.5,
  minHeight: 32,
  "&.Mui-focusVisible": { outline: "2px solid", outlineColor: "primary.main" },
};
