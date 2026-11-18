"use client";

import type { ActionButtonProps } from "atoms/ui/ActionButton/ActionButton";
import { ActionButton } from "atoms/ui/ActionButton/ActionButton";
import { designTokens } from "theme/theme";

/** 编辑记账页底部操作共用尺寸，颜色与行为由 MUI 属性区分。 */
export function EditTransactionActionButton({ sx, ...props }: ActionButtonProps) {
  return (
    <ActionButton
      variant="contained"
      {...props}
      fullWidth
      size="large"
      sx={[actionButtonSx, ...(Array.isArray(sx) ? sx : [sx])]}
    />
  );
}

const actionButtonSx = {
  borderRadius: `${designTokens.radius.md}px`,
  fontSize: "1rem",
  fontWeight: 800,
  minHeight: 48,
  // 两种 variant 使用相同边框占位，避免 MUI 默认 padding 的差异。
  border: "1px solid",
  borderColor: "transparent",
  px: 2.5,
  py: 1,
  "&&.MuiButton-outlined.MuiButton-colorError:is(:not(.Mui-disabled), [data-action-pending='true'])": {
    borderColor: "error.main",
    color: "error.main",
  },
  "&.MuiButton-contained:is(:not(.Mui-disabled), [data-action-pending='true'])": {
    background: "var(--user-theme-fab-bg)",
    color: "var(--user-theme-fab-text)",
  },
};
