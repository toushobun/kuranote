"use client";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import Slide, { type SlideProps } from "@mui/material/Slide";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useCallback, useRef, type ReactNode, type TouchEvent } from "react";

import { useBackLayer } from "molecules/ui/UnsavedChangesDialog/BackLayerScope";
import { designTokens } from "theme/theme";

function DrawerSlide({ in: open, onExited, ...props }: SlideProps) {
  // #1074：恢复抽屉与退出动画结束同次提交时，忽略旧的退出回调。
  return <Slide {...props} in={open} onExited={open ? undefined : onExited} />;
}

export function BottomEditorDrawer({
  children,
  closeLabel,
  footer,
  onClose,
  open,
  suspended = false,
  title,
  zIndex,
}: {
  children: ReactNode;
  closeLabel: string;
  footer?: ReactNode;
  onClose: () => void;
  open: boolean;
  suspended?: boolean;
  title: string;
  zIndex?: number;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const getSlideContainer = useCallback(() => rootRef.current!, []);
  const touchStartY = useRef<number | null>(null);
  useBackLayer(open && !suspended, onClose);

  function onHandleTouchStart(event: TouchEvent) {
    touchStartY.current = event.touches[0]?.clientY ?? null;
  }

  function onHandleTouchEnd(event: TouchEvent) {
    const startY = touchStartY.current;
    touchStartY.current = null;
    if (
      startY !== null &&
      (event.changedTouches[0]?.clientY ?? startY) - startY > 64
    ) {
      onClose();
    }
  }

  return (
    <Drawer
      ref={rootRef}
      anchor="bottom"
      open={open && !suspended}
      ModalProps={{ keepMounted: suspended }}
      onClose={onClose}
      sx={{
        zIndex,
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
        sx={{
          p: 2,
          pb: "max(16px, env(safe-area-inset-bottom))",
          minHeight: 0,
          maxHeight: "90dvh",
          boxSizing: "border-box",
          overflow: "hidden",
        }}
      >
        <Box
          aria-hidden
          data-testid="bottom-editor-drag-handle"
          onTouchStart={onHandleTouchStart}
          onTouchEnd={onHandleTouchEnd}
          onTouchCancel={() => {
            touchStartY.current = null;
          }}
          sx={{
            alignItems: "center",
            alignSelf: "center",
            display: "flex",
            flexShrink: 0,
            height: 24,
            justifyContent: "center",
            touchAction: "pan-y",
            width: 88,
          }}
        >
          <Box
            sx={{
              bgcolor: "divider",
              borderRadius: `${designTokens.radius.full}px`,
              height: 4,
              width: 44,
            }}
          />
        </Box>
        <Stack
          direction="row"
          sx={{ alignItems: "center", justifyContent: "space-between" }}
        >
          <Typography component="h2" variant="h6">
            {title}
          </Typography>
          <IconButton aria-label={closeLabel} onClick={onClose}>
            <CloseRoundedIcon />
          </IconButton>
        </Stack>
        <Box
          data-testid="bottom-editor-scroll-content"
          sx={{ flex: "1 1 auto", overflowY: "auto", minHeight: 0 }}
        >
          {children}
        </Box>
        {footer}
      </Stack>
    </Drawer>
  );
}
