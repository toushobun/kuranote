"use client";
import type { ReactNode } from "react";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import Drawer from "@mui/material/Drawer";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import { designTokens } from "theme/theme";
import { amountKeypadZIndex } from "theme/zIndex";
import { transactionBottomEditorDrawerMessages as m } from "config/transactionMessages";

export function TransactionBottomEditorDrawer({
  open,
  suspended = false,
  title,
  onClose,
  children,
}: {
  open: boolean;
  /** 上层新增弹层打开时隐藏抽屉但保留选择组件，关闭后恢复。 */
  suspended?: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <Drawer
      anchor="bottom"
      open={open && !suspended}
      ModalProps={{ keepMounted: suspended }}
      onClose={onClose}
      sx={{
        zIndex: amountKeypadZIndex,
        visibility: suspended ? "hidden" : undefined,
      }}
      slotProps={{
        paper: {
          sx: {
            borderRadius: `${designTokens.radius.lg}px ${designTokens.radius.lg}px 0 0`,
            maxHeight: "90dvh",
          },
        },
      }}
    >
      <Stack
        spacing={2}
        sx={{ p: 2, pb: "max(16px, env(safe-area-inset-bottom))" }}
      >
        <Stack
          direction="row"
          sx={{ alignItems: "center", justifyContent: "space-between" }}
        >
          <Typography variant="h6">{title}</Typography>
          <IconButton aria-label={m.close(title)} onClick={onClose}>
            <CloseRoundedIcon />
          </IconButton>
        </Stack>
        <Box sx={{ overflowY: "auto" }}>{children}</Box>
        <Button variant="contained" fullWidth onClick={onClose}>
          {m.done}
        </Button>
      </Stack>
    </Drawer>
  );
}
