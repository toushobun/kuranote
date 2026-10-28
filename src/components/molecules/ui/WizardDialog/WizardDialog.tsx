"use client";

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
            ? wizardDialogHeaderSx
            : [completeHeaderSx, closeAlignment === "start" && startHeaderSx]
        }
      >
        <Box
          sx={
            title
              ? [
                  wizardDialogTitleRowSx,
                  titleAction ? { gridTemplateColumns: "40px 1fr auto" } : {},
                ]
              : undefined
          }
        >
          <IconButton
            aria-label={closeLabel}
            disabled={disabled}
            onClick={requestClose}
          >
            <CloseRoundedIcon />
          </IconButton>
          {title ? (
            <Typography component="h2" id={headingId} sx={wizardDialogTitleSx}>
              {title}
            </Typography>
          ) : null}
          {titleAction}
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
