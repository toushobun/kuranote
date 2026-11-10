"use client";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import ButtonBase from "@mui/material/ButtonBase";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";

import { flowMessages as m } from "config/transactionStepFlowMessages";
import { designTokens } from "theme/theme";

import { receiptPencilSx, receiptSectionSx } from "./receiptStyles";

/**
 * 小票的金额行（合计、转账金额、调整金额）：左边标题，右边大号金额与下方小字。
 * 传 `onClick` 时金额可点（带铅笔），没填金额时显示「待输入」。
 */
export function ReceiptAmountRow({
  label,
  amount,
  caption,
  color = "primary.main",
  error = false,
  onClick,
}: {
  label: string;
  /** 空字符串表示还没填写。 */
  amount: string;
  caption?: ReactNode;
  color?: string;
  error?: boolean;
  onClick?: () => void;
}) {
  const pending = !amount;
  const value = (
    <Typography
      variant={pending ? "subtitle1" : "h5"}
      data-invalid={error || undefined}
      sx={{
        color: error ? "error.main" : pending ? "text.disabled" : color,
        fontWeight: 800,
      }}
    >
      {amount || m.pendingAmount}
    </Typography>
  );
  return (
    <Stack
      direction="row"
      sx={[receiptSectionSx, { alignItems: "center", py: 1.5 }]}
    >
      <Typography
        sx={{ flex: 1, fontWeight: 700, pr: 1, whiteSpace: "nowrap" }}
      >
        {label}
      </Typography>
      <Stack sx={{ alignItems: "flex-end", minWidth: 0 }}>
        {onClick ? (
          <ButtonBase
            aria-label={m.editReceiptRow(label, amount || m.pendingAmount)}
            onClick={onClick}
            sx={amountButtonSx}
          >
            {value}
            <EditOutlinedIcon aria-hidden sx={receiptPencilSx} />
          </ButtonBase>
        ) : (
          value
        )}
        {caption && (
          <Typography
            variant="caption"
            color="textSecondary"
            sx={{ textAlign: "right" }}
          >
            {caption}
          </Typography>
        )}
      </Stack>
    </Stack>
  );
}

const amountButtonSx = {
  alignItems: "center",
  borderRadius: `${designTokens.radius.sm}px`,
  gap: 0.5,
};
