"use client";

import type { ReactNode } from "react";

import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Link from "next/link";

import { routePaths } from "config/paths";

/** 新增 / 编辑记账页的顶栏：返回明细、居中标题、右侧操作。有未保存修改时返回改为 `onClose`。 */
export function TransactionPageTopBar({
  action,
  hasUnsavedChanges = false,
  onClose,
  title,
}: {
  action?: ReactNode;
  hasUnsavedChanges?: boolean;
  onClose?: () => void;
  title: string;
}) {
  return (
    <Box sx={newTransactionTopBarSx}>
      {hasUnsavedChanges && onClose ? (
        <IconButton
          aria-label="关闭"
          onClick={onClose}
          sx={newTransactionCloseButtonSx}
        >
          <ArrowBackRoundedIcon />
        </IconButton>
      ) : (
        <IconButton
          aria-label="关闭"
          component={Link}
          href={routePaths.transactions}
          sx={newTransactionCloseButtonSx}
        >
          <ArrowBackRoundedIcon />
        </IconButton>
      )}
      <Typography component="h1" variant="h5" sx={newTransactionTitleSx}>
        {title}
      </Typography>
      {action ? (
        <Box sx={{ justifySelf: "end" }}>{action}</Box>
      ) : (
        <Box aria-hidden sx={{ width: 40 }} />
      )}
    </Box>
  );
}

// 两侧等宽、标题居中；右侧可放「切换方式」等操作。
const newTransactionTopBarSx = {
  alignItems: "center",
  display: "grid",
  gridTemplateColumns: "minmax(40px, 1fr) auto minmax(40px, 1fr)",
  pb: 1.5,
  pt: { xs: 0, sm: 0.5 },
};

const newTransactionCloseButtonSx = {
  "@media (hover: hover)": {
    "&:hover": {
      bgcolor: "action.hover",
    },
  },
  color: "text.secondary",
  justifySelf: "start",
};

const newTransactionTitleSx = {
  color: "text.primary",
  fontSize: "1rem",
  fontWeight: 800,
  letterSpacing: 0,
  lineHeight: 1.25,
  textAlign: "center",
};
