"use client";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import IconButton from "@mui/material/IconButton";
import { useTheme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useId, useLayoutEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useWizardDialogSwitchPane } from "./wizardDialogSwitchContext";
import {
  enterlessTransitionDuration,
  fullScreenWizardDialogPaperSx,
  wizardDialogHeaderSx,
  wizardDialogPaperSx,
  wizardDialogTitleOnlyHeaderSx,
  wizardDialogTitleOnlyRowSx,
  wizardDialogTitleRowSx,
  wizardDialogTitleSx,
} from "./wizardDialogStyles";

type WizardDialogProps = {
  children: ReactNode;
  closeLabel: string;
  closeAlignment?: "start" | "end";
  disabled?: boolean;
  /** 打开时不淡入（如记一笔从骨架切换过来时，避免露出底部的页面与底部导航）。 */
  disableEnterTransition?: boolean;
  headerContent?: ReactNode;
  titleAction?: ReactNode;
  onClose: () => void;
  open: boolean;
  title?: string;
  titleId?: string;
  ariaLabel?: string;
};

/**
 * 移动端全屏、桌面端居中的弹框外壳，标题栏统一预留顶部安全区。
 * 放在 WizardDialogSwitch 里时不自己开弹框：标题栏渲染进共用外框，内容留在所在面板。
 */
export function WizardDialog({
  children,
  closeLabel,
  closeAlignment = "end",
  disabled = false,
  disableEnterTransition = false,
  headerContent,
  titleAction,
  onClose,
  open,
  title,
  titleId,
  ariaLabel,
}: WizardDialogProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const generatedTitleId = useId();
  const pane = useWizardDialogSwitchPane();
  const headingId = pane?.titleId ?? titleId ?? generatedTitleId;
  function requestClose() {
    if (!disabled) onClose();
  }
  useLayoutEffect(() => {
    if (pane?.active) pane.setCloseHandler(requestClose);
  });
  const closeButton = (
    <IconButton
      aria-label={closeLabel}
      disabled={disabled}
      onClick={requestClose}
    >
      <CloseRoundedIcon />
    </IconButton>
  );
  const header = (
    <Box
      sx={
        title
          ? [
              wizardDialogHeaderSx,
              !headerContent && wizardDialogTitleOnlyHeaderSx,
            ]
          : [completeHeaderSx, closeAlignment === "start" && startHeaderSx]
      }
    >
      <Box
        sx={
          title
            ? [
                wizardDialogTitleRowSx,
                !headerContent && wizardDialogTitleOnlyRowSx,
                titleAction ? { gridTemplateColumns: "40px 1fr auto" } : {},
              ]
            : undefined
        }
      >
        {closeButton}
        {title ? (
          <Typography component="h2" id={headingId} sx={wizardDialogTitleSx}>
            {title}
          </Typography>
        ) : null}
        {titleAction}
      </Box>
      {headerContent}
    </Box>
  );
  if (pane) {
    return (
      <>
        {pane.active && pane.headerSlot
          ? createPortal(header, pane.headerSlot)
          : null}
        {children}
      </>
    );
  }
  return (
    <Dialog
      aria-labelledby={title || titleId ? headingId : undefined}
      fullScreen={fullScreen}
      fullWidth
      maxWidth={false}
      onClose={requestClose}
      open={open}
      transitionDuration={
        disableEnterTransition ? enterlessTransitionDuration(theme) : undefined
      }
      slotProps={{
        paper: {
          "aria-label": ariaLabel,
          sx: fullScreen ? fullScreenWizardDialogPaperSx : wizardDialogPaperSx,
        },
      }}
    >
      {header}
      {children}
    </Dialog>
  );
}

const completeHeaderSx = {
  display: "flex",
  flexShrink: 0,
  justifyContent: "flex-end",
  pt: "calc(8px + env(safe-area-inset-top))",
  px: { xs: 1, sm: 2 },
};

const startHeaderSx = { justifyContent: "flex-start" };
