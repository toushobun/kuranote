"use client";

import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import Box from "@mui/material/Box";
import Button, { type ButtonProps } from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import { useId, type ReactNode } from "react";

import { useUserTheme } from "theme/UserThemeProvider";
import type { UserThemeKey } from "theme/userThemeTokens";

const dialogText = {
  cancel: "取消",
  confirm: "确认",
} as const;

const deleteIllustrationByTheme = {
  amberWarmth:
    "/assets/kura-delete-confirm/delete_illustration_amber_warmth.png",
  deepSeaStarlight:
    "/assets/kura-delete-confirm/delete_illustration_deep_sea.png",
  emeraldMorning:
    "/assets/kura-delete-confirm/delete_illustration_emerald_morning.png",
  flameRed: "/assets/kura-delete-confirm/delete_illustration_crimson_flame.png",
  lavenderDream:
    "/assets/kura-delete-confirm/delete_illustration_lavender_dream.png",
  sakuraStory:
    "/assets/kura-delete-confirm/delete_illustration_sakura_story.png",
} satisfies Record<UserThemeKey, string>;

export type FeedbackDialogProps = {
  description?: ReactNode;
  onClose: () => void;
  open: boolean;
  title: ReactNode;
};

type FeedbackTone = "error" | "success";

function FeedbackDialog({
  description,
  onClose,
  open,
  title,
  tone,
}: FeedbackDialogProps & { tone: FeedbackTone }) {
  const titleId = useId();
  const descriptionId = useId();
  const isError = tone === "error";

  return (
    <Dialog
      aria-describedby={description ? descriptionId : undefined}
      aria-labelledby={titleId}
      fullWidth
      maxWidth="xs"
      onClose={onClose}
      open={open}
      sx={feedbackDialogSx}
      slotProps={{
        paper: {
          sx: {
            ...feedbackPaperSx,
            ...(isError && {
              border: "1.5px solid",
              borderColor: "error.main",
            }),
          },
        },
      }}
    >
      <DialogContent sx={feedbackContentSx}>
        <Box
          aria-hidden="true"
          sx={{
            ...feedbackIconSx,
            bgcolor: isError
              ? "var(--user-theme-negative-bg)"
              : "var(--user-theme-income-bg)",
            color: isError
              ? "var(--user-theme-negative-amount)"
              : "var(--user-theme-income-amount)",
          }}
        >
          {isError ? (
            <ErrorOutlineRoundedIcon sx={{ fontSize: 24 }} />
          ) : (
            <CheckCircleOutlineRoundedIcon sx={{ fontSize: 24 }} />
          )}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <DialogTitle component="h2" id={titleId} sx={dialogTitleSx}>
            {title}
          </DialogTitle>
          {description ? (
            <Typography
              color="text.secondary"
              component="div"
              id={descriptionId}
              sx={dialogDescriptionSx}
            >
              {description}
            </Typography>
          ) : null}
        </Box>
        <IconButton
          aria-label="关闭"
          onClick={onClose}
          size="small"
          sx={{ alignSelf: "flex-start", color: "text.secondary", ml: 0.5 }}
        >
          <CloseRoundedIcon fontSize="small" />
        </IconButton>
      </DialogContent>
    </Dialog>
  );
}

export function SuccessFeedbackDialog(props: FeedbackDialogProps) {
  return <FeedbackDialog {...props} tone="success" />;
}

export function FailureFeedbackDialog(props: FeedbackDialogProps) {
  return <FeedbackDialog {...props} tone="error" />;
}

export type ConfirmationDialogProps = {
  cancelLabel?: ReactNode;
  confirmColor?: ButtonProps["color"];
  confirmLabel?: ReactNode;
  description?: ReactNode;
  illustration?: ReactNode;
  onCancel: () => void;
  onConfirm: () => void;
  open: boolean;
  title: ReactNode;
};

export function ConfirmationDialog({
  cancelLabel = dialogText.cancel,
  confirmColor = "primary",
  confirmLabel = dialogText.confirm,
  description,
  illustration,
  onCancel,
  onConfirm,
  open,
  title,
}: ConfirmationDialogProps) {
  const { themeKey } = useUserTheme();
  const titleId = useId();
  const descriptionId = useId();
  const illustrationSrc = deleteIllustrationByTheme[themeKey];

  return (
    <Dialog
      aria-describedby={description ? descriptionId : undefined}
      aria-labelledby={titleId}
      fullWidth
      maxWidth="xs"
      onClose={onCancel}
      open={open}
      slotProps={{ paper: { sx: dialogPaperSx } }}
    >
      <DialogContent sx={confirmationContentSx}>
        {illustration ?? (
          <Box
            alt=""
            aria-hidden="true"
            component="img"
            src={illustrationSrc}
            sx={confirmationIllustrationSx}
          />
        )}
        <DialogTitle component="h2" id={titleId} sx={confirmationTitleSx}>
          {title}
        </DialogTitle>
        {description ? (
          <Typography
            color="text.secondary"
            component="div"
            id={descriptionId}
            sx={confirmationDescriptionSx}
          >
            {description}
          </Typography>
        ) : null}
      </DialogContent>
      <DialogActions sx={confirmationActionsSx}>
        <Button fullWidth onClick={onCancel} variant="outlined">
          {cancelLabel}
        </Button>
        <Button
          color={confirmColor}
          fullWidth
          onClick={onConfirm}
          variant="contained"
        >
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

const feedbackDialogSx = {
  "& .MuiDialog-container": {
    alignItems: "flex-end",
    pb: 2,
  },
};

const feedbackPaperSx = {
  borderRadius: 3,
  mx: 2,
  width: "calc(100% - 32px)",
};

const dialogPaperSx = {
  borderRadius: 4,
  mx: 1.5,
  width: "calc(100% - 24px)",
};

const feedbackContentSx = {
  alignItems: "center",
  display: "flex",
  flexDirection: "row",
  gap: 1.5,
  px: 2,
  py: 1.75,
  "&:last-child": { pb: 1.75 },
};

const confirmationContentSx = {
  alignItems: "center",
  display: "flex",
  flexDirection: "column",
  px: 3,
  pb: 1,
  pt: 2.5,
  textAlign: "center",
};

const feedbackIconSx = {
  alignItems: "center",
  borderRadius: "50%",
  display: "flex",
  flexShrink: 0,
  height: 44,
  justifyContent: "center",
  width: 44,
};

const confirmationIllustrationSx = {
  height: { xs: 132, sm: 152 },
  objectFit: "contain",
  width: { xs: 132, sm: 152 },
};

const dialogTitleSx = {
  color: "text.primary",
  fontSize: 14,
  fontWeight: 700,
  p: 0,
};

const dialogDescriptionSx = {
  fontSize: 13,
  lineHeight: 1.6,
  mt: 0.25,
};

const confirmationTitleSx = {
  color: "text.primary",
  fontSize: 20,
  fontWeight: 900,
  p: 0,
  textAlign: "center",
};

const confirmationDescriptionSx = {
  lineHeight: 1.8,
  mt: 1,
  textAlign: "center",
};

const confirmationActionsSx = {
  gap: 1.25,
  px: 3,
  pb: 3,
  pt: 2,
};
