"use client";
import { useBackLayer } from "molecules/ui/UnsavedChangesDialog/BackLayerScope";
import { useCallback, useRef, type ReactNode } from "react";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import Drawer from "@mui/material/Drawer";
import Slide, { type SlideProps } from "@mui/material/Slide";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import { designTokens } from "theme/theme";
import { amountKeypadZIndex } from "theme/zIndex";
import { transactionBottomEditorDrawerMessages as m } from "config/transactionMessages";

function DrawerSlide({ in: open, onExited, ...props }: SlideProps) {
  // 恢复抽屉与退出动画结束可能在同一次提交，忽略已经过期的退出回调。
  return <Slide {...props} in={open} onExited={open ? undefined : onExited} />;
}

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
  // 自定义 Slide 插槽时，MUI 不再自动传入抽屉根节点。
  const rootRef = useRef<HTMLDivElement>(null);
  const getSlideContainer = useCallback(() => rootRef.current!, []);
  useBackLayer(open && !suspended, onClose);
  return (
    <Drawer
      ref={rootRef}
      anchor="bottom"
      open={open && !suspended}
      ModalProps={{ keepMounted: suspended }}
      onClose={onClose}
      sx={{
        zIndex: amountKeypadZIndex,
        visibility: suspended ? "hidden" : undefined,
      }}
      slots={{ transition: DrawerSlide }}
      slotProps={{
        transition: { container: getSlideContainer } as Partial<SlideProps>,
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
