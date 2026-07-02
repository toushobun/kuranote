"use client";

import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Box from "@mui/material/Box";
import Button, { type ButtonProps } from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Snackbar from "@mui/material/Snackbar";
import Typography from "@mui/material/Typography";
import { useId, type ReactNode } from "react";

import { bottomNavigationLayout } from "organisms/navigation/bottomNavigationLayout";
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
  const isError = tone === "error";

  return (
    <Snackbar
      anchorOrigin={{ horizontal: "center", vertical: "bottom" }}
      autoHideDuration={3000}
      onClose={onClose}
      open={open}
      sx={feedbackSnackbarSx}
    >
      <Alert
        closeText="关闭"
        icon={
          isError ? (
            <ErrorOutlineRoundedIcon sx={{ fontSize: 24 }} />
          ) : (
            <CheckCircleOutlineRoundedIcon sx={{ fontSize: 24 }} />
          )
        }
        onClose={onClose}
        role={isError ? "alert" : "status"}
        severity={isError ? "error" : "success"}
        sx={feedbackAlertSx(isError)}
        variant="standard"
      >
        <AlertTitle sx={dialogTitleSx}>{title}</AlertTitle>
        {description ? (
          <Typography
            color="text.secondary"
            component="p"
            sx={dialogDescriptionSx}
          >
            {description}
          </Typography>
        ) : null}
      </Alert>
    </Snackbar>
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

const feedbackToastOffset = `calc(${bottomNavigationLayout.shellPaddingBottom} + 12px)`;

const feedbackSnackbarSx = {
  bottom: { xs: feedbackToastOffset, sm: feedbackToastOffset },
};

function feedbackAlertSx(isError: boolean) {
  return {
    alignItems: "center",
    bgcolor: "background.paper",
    border: "1.5px solid",
    borderColor: isError ? "error.main" : "transparent",
    borderRadius: 2,
    boxShadow: 6,
    color: "text.primary",
    maxWidth: 444,
    px: 2,
    py: 1.75,
    width: "100%",
    "& .MuiAlert-icon": {
      alignItems: "center",
      bgcolor: isError
        ? "var(--user-theme-negative-bg)"
        : "var(--user-theme-income-bg)",
      borderRadius: "50%",
      color: isError
        ? "var(--user-theme-negative-amount)"
        : "var(--user-theme-income-amount)",
      display: "flex",
      flexShrink: 0,
      height: 44,
      justifyContent: "center",
      mr: 1.5,
      p: 0,
      width: 44,
    },
    "& .MuiAlert-message": {
      flex: 1,
      minWidth: 0,
      p: 0,
    },
    "& .MuiAlert-action": {
      alignItems: "flex-start",
      color: "text.secondary",
      mt: 0,
      pl: 0.5,
      pt: 0,
    },
  };
}

const dialogPaperSx = {
  borderRadius: 4,
  mx: 1.5,
  width: "calc(100% - 24px)",
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

const confirmationIllustrationSx = {
  height: { xs: 132, sm: 152 },
  objectFit: "contain",
  width: { xs: 132, sm: 152 },
};

const dialogTitleSx = {
  color: "text.primary",
  fontSize: 14,
  fontWeight: 700,
  mb: 0,
  mt: 0,
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
