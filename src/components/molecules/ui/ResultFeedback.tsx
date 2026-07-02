import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import SearchOffRoundedIcon from "@mui/icons-material/SearchOffRounded";
import Box from "@mui/material/Box";
import Button, { type ButtonProps } from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import type { SxProps, Theme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";

import { designTokens } from "theme/theme";

export type ResultFeedbackVariant = "success" | "error" | "empty" | "info";

type ResultFeedbackTone = {
  accent: string;
  ariaLive: "polite" | "assertive";
  role: "status" | "alert";
  surface: string;
};

export type ResultFeedbackProps = {
  action?: ReactNode;
  actionLabel?: ReactNode;
  actionVariant?: ButtonProps["variant"];
  icon?: ReactNode;
  message?: ReactNode;
  onAction?: ButtonProps["onClick"];
  sx?: SxProps<Theme>;
  title: ReactNode;
  variant?: ResultFeedbackVariant;
};

const resultFeedbackTones = {
  success: {
    accent: "var(--user-theme-business-completed-text)",
    ariaLive: "polite",
    role: "status",
    surface: "var(--user-theme-business-completed-bg)",
  },
  error: {
    accent: "var(--user-theme-negative-amount)",
    ariaLive: "assertive",
    role: "alert",
    surface: "var(--user-theme-negative-bg)",
  },
  empty: {
    accent: "var(--user-theme-secondary-text)",
    ariaLive: "polite",
    role: "status",
    surface: "var(--user-theme-filter-summary-bg)",
  },
  info: {
    accent: "var(--user-theme-tx-accent)",
    ariaLive: "polite",
    role: "status",
    surface: "var(--user-theme-bottom-nav-active-bg)",
  },
} satisfies Record<ResultFeedbackVariant, ResultFeedbackTone>;

function DefaultResultIcon({ variant }: { variant: ResultFeedbackVariant }) {
  switch (variant) {
    case "success":
      return <CheckRoundedIcon fontSize="large" />;
    case "error":
      return <ErrorOutlineRoundedIcon fontSize="large" />;
    case "empty":
      return <SearchOffRoundedIcon fontSize="large" />;
    case "info":
      return <InfoOutlinedIcon fontSize="large" />;
  }
}

function ResultFeedbackIllustration({
  icon,
  tone,
  variant,
}: {
  icon?: ReactNode;
  tone: ResultFeedbackTone;
  variant: ResultFeedbackVariant;
}) {
  return (
    <Box
      aria-hidden="true"
      sx={{
        display: "grid",
        height: 92,
        placeItems: "center",
        position: "relative",
        width: 112,
      }}
    >
      <Box
        sx={{
          backgroundColor: tone.surface,
          border: "1px solid var(--user-theme-card-border)",
          borderRadius: "999px",
          height: 64,
          position: "absolute",
          transform: "rotate(-6deg)",
          width: 92,
        }}
      />
      <Box
        sx={{
          backgroundColor: tone.surface,
          border: "1px solid var(--user-theme-card-border)",
          borderRadius: "50%",
          height: 18,
          position: "absolute",
          right: 12,
          top: 8,
          width: 18,
        }}
      />
      <Box
        sx={{
          backgroundColor: "var(--user-theme-card-bg)",
          border: "1px solid var(--user-theme-card-border)",
          borderRadius: `${designTokens.radius.lg}px`,
          boxShadow: "var(--user-theme-card-shadow)",
          color: tone.accent,
          display: "grid",
          height: 64,
          placeItems: "center",
          position: "relative",
          transform: "rotate(3deg)",
          width: 64,
        }}
      >
        {icon ?? <DefaultResultIcon variant={variant} />}
      </Box>
    </Box>
  );
}

export function ResultFeedback({
  action,
  actionLabel,
  actionVariant = "outlined",
  icon,
  message,
  onAction,
  sx,
  title,
  variant = "info",
}: ResultFeedbackProps) {
  const tone = resultFeedbackTones[variant];
  const feedbackAction =
    action ??
    (actionLabel ? (
      <Button
        onClick={onAction}
        variant={actionVariant}
        sx={{ minWidth: 120, px: 3 }}
      >
        {actionLabel}
      </Button>
    ) : null);

  return (
    <Box
      aria-live={tone.ariaLive}
      data-variant={variant}
      role={tone.role}
      sx={[
        {
          mx: "auto",
          px: { xs: 2, sm: 3 },
          py: { xs: 4, sm: 5 },
          textAlign: "center",
          width: "100%",
          maxWidth: 420,
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <Stack spacing={2} sx={{ alignItems: "center" }}>
        <ResultFeedbackIllustration icon={icon} tone={tone} variant={variant} />
        <Stack spacing={1} sx={{ alignItems: "center" }}>
          <Typography
            variant="h6"
            sx={{
              color: "var(--user-theme-balance-text)",
              fontWeight: 800,
              letterSpacing: "-0.02em",
            }}
          >
            {title}
          </Typography>
          {message ? (
            <Typography
              component="div"
              variant="body2"
              sx={{
                color: "var(--user-theme-section-text)",
                maxWidth: 320,
              }}
            >
              {message}
            </Typography>
          ) : null}
        </Stack>
        {feedbackAction ? <Box sx={{ pt: 0.5 }}>{feedbackAction}</Box> : null}
      </Stack>
    </Box>
  );
}
