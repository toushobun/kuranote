"use client";

import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import IconButton from "@mui/material/IconButton";
import { useTheme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useId, type ReactNode } from "react";
import {
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
  headerContent?: ReactNode;
  titleAction?: ReactNode;
  /** 传入时左上角为返回 ←，关闭 × 移到右上角（不再显示 `titleAction`）。 */
  back?: { label: string; onClick: () => void };
  onClose: () => void;
  open: boolean;
  title?: string;
  titleId?: string;
  ariaLabel?: string;
};

/** 移动端全屏、桌面端居中的弹框外壳，标题栏统一预留顶部安全区。 */
export function WizardDialog({
  children,
  closeLabel,
  closeAlignment = "end",
  disabled = false,
  headerContent,
  titleAction,
  back,
  onClose,
  open,
  title,
  titleId,
  ariaLabel,
}: WizardDialogProps) {
  const fullScreen = useMediaQuery(useTheme().breakpoints.down("sm"));
  const generatedTitleId = useId();
  const headingId = titleId ?? generatedTitleId;
  function requestClose() {
    if (!disabled) onClose();
  }
  const closeButton = (
    <IconButton
      aria-label={closeLabel}
      disabled={disabled}
      onClick={requestClose}
    >
      <CloseRoundedIcon />
    </IconButton>
  );
  return (
    <Dialog
      aria-labelledby={title || titleId ? headingId : undefined}
      fullScreen={fullScreen}
      fullWidth
      maxWidth={false}
      onClose={requestClose}
      open={open}
      slotProps={{
        paper: {
          "aria-label": ariaLabel,
          sx: fullScreen ? fullScreenPaperSx : wizardDialogPaperSx,
        },
      }}
    >
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
                  titleAction && !back
                    ? { gridTemplateColumns: "40px 1fr auto" }
                    : {},
                ]
              : undefined
          }
        >
          {back ? (
            <IconButton
              aria-label={back.label}
              disabled={disabled}
              onClick={back.onClick}
            >
              <ArrowBackRoundedIcon />
            </IconButton>
          ) : (
            closeButton
          )}
          {title ? (
            <Typography component="h2" id={headingId} sx={wizardDialogTitleSx}>
              {title}
            </Typography>
          ) : null}
          {back ? closeButton : titleAction}
        </Box>
        {headerContent}
      </Box>
      {children}
    </Dialog>
  );
}

const fullScreenPaperSx = { overflow: "hidden" };
const completeHeaderSx = {
  display: "flex",
  flexShrink: 0,
  justifyContent: "flex-end",
  pt: "calc(8px + env(safe-area-inset-top))",
  px: { xs: 1, sm: 2 },
};

const startHeaderSx = { justifyContent: "flex-start" };
