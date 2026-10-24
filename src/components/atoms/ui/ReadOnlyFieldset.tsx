import Box from "@mui/material/Box";
import type { ReactNode } from "react";

/**
 * 只读详情时整体禁用表单（#928）：原生 disabled fieldset 让其中的输入框、按钮
 * 都不能操作，也不会触发计算器；MUI Select 不受 fieldset 影响，需各自设为 readOnly。
 */
export function ReadOnlyFieldset({
  children,
  readOnly,
}: {
  children: ReactNode;
  readOnly: boolean;
}) {
  return (
    <Box component="fieldset" disabled={readOnly} sx={fieldsetResetSx}>
      {children}
    </Box>
  );
}

const fieldsetResetSx = {
  border: 0,
  m: 0,
  minWidth: 0,
  p: 0,
};
