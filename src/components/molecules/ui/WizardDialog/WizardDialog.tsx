"use client";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import IconButton from "@mui/material/IconButton";
import { useTheme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useId, type ReactNode } from "react";
import { designTokens } from "theme/theme";

type WizardDialogProps = {
  children: ReactNode;
  closeLabel: string;
  closeAlignment?: "start" | "end";
  disabled?: boolean;
  headerContent?: ReactNode;
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
          sx: fullScreen ? fullScreenPaperSx : paperSx,
        },
      }}
    >
      <Box
        sx={
          title
            ? headerSx
            : [completeHeaderSx, closeAlignment === "start" && startHeaderSx]
        }
      >
        <Box sx={title ? titleRowSx : undefined}>
          <IconButton
            aria-label={closeLabel}
            disabled={disabled}
            onClick={requestClose}
          >
            <CloseRoundedIcon />
          </IconButton>
          {title ? (
            <Typography component="h2" id={headingId} sx={titleSx}>
              {title}
            </Typography>
          ) : null}
        </Box>
        {headerContent}
      </Box>
      {children}
    </Dialog>
  );
}

const paperSx = {
  borderRadius: `${designTokens.radius.xl}px`,
  height: "min(760px, calc(100% - 64px))",
  maxWidth: 560,
  overflow: "hidden",
};
const fullScreenPaperSx = { overflow: "hidden" };
const headerSx = {
  borderBottom: "1px solid",
  borderColor: "divider",
  flexShrink: 0,
  pb: 2,
  pt: "calc(8px + env(safe-area-inset-top))",
  px: { xs: 1, sm: 2 },
};
// 关闭按钮在左、标题居中：右侧留出与按钮等宽的空列。
const titleRowSx = {
  alignItems: "center",
  display: "grid",
  gridTemplateColumns: "40px 1fr 40px",
  mb: 1.5,
};
const completeHeaderSx = {
  display: "flex",
  flexShrink: 0,
  justifyContent: "flex-end",
  pt: "calc(8px + env(safe-area-inset-top))",
  px: { xs: 1, sm: 2 },
};
const titleSx = {
  color: "text.primary",
  fontSize: 17,
  fontWeight: 900,
  textAlign: "center",
};

const startHeaderSx = { justifyContent: "flex-start" };
