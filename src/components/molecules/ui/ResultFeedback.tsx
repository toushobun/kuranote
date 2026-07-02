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

import { SectionCard } from "./SectionCard";

export type ResultFeedbackVariant = "success" | "error" | "empty" | "info";
export type ResultFeedbackSurface = "plain" | "card";

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
  illustration?: ReactNode;
  message?: ReactNode;
  onAction?: ButtonProps["onClick"];
  surface?: ResultFeedbackSurface;
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
  illustration,
  tone,
  variant,
}: {
  icon?: ReactNode;
  illustration?: ReactNode;
  tone: ResultFeedbackTone;
  variant: ResultFeedbackVariant;
}) {
  if (illustration) {
    return <Box aria-hidden="true">{illustration}</Box>;
  }

  return (
    <Box
      aria-hidden="true"
      sx={{
        display: "grid",
        minHeight: 132,
        placeItems: "center",
        position: "relative",
        width: "100%",
      }}
    >
      <Box
        sx={{
          backgroundColor: tone.surface,
          borderRadius: `${designTokens.radius.lg * 2}px`,
          bottom: 14,
          height: 84,
          left: "50%",
          position: "absolute",
          transform: "translateX(-50%)",
          width: { xs: 188, sm: 220 },
        }}
      />
      <Box
        sx={{
          backgroundColor: "var(--user-theme-card-bg)",
          border: "1px solid var(--user-theme-card-border)",
          borderRadius: "50%",
          bottom: 28,
          height: 16,
          left: "24%",
          position: "absolute",
          width: 16,
        }}
      />
      <Box
        sx={{
          backgroundColor: "var(--user-theme-card-bg)",
          border: "1px solid var(--user-theme-card-border)",
          borderRadius: "50%",
          height: 22,
          position: "absolute",
          right: "24%",
          top: 28,
          width: 22,
        }}
      />
      <Box
        sx={{
          backgroundColor: "var(--user-theme-card-bg)",
          border: "1px solid var(--user-theme-card-border)",
          borderRadius: "50%",
          boxShadow: "var(--user-theme-card-shadow)",
          color: tone.accent,
          display: "grid",
          height: 80,
          placeItems: "center",
          position: "relative",
          width: 80,
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
  illustration,
  message,
  onAction,
  surface = "plain",
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
        sx={{ minWidth: 128, px: 3 }}
      >
        {actionLabel}
      </Button>
    ) : null);

  const content = (
    <Stack spacing={2.25} sx={{ alignItems: "center" }}>
      <ResultFeedbackIllustration
        icon={icon}
        illustration={illustration}
        tone={tone}
        variant={variant}
      />
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
              lineHeight: 1.8,
              maxWidth: 320,
            }}
          >
            {message}
          </Typography>
        ) : null}
      </Stack>
      {feedbackAction ? <Box sx={{ pt: 0.5 }}>{feedbackAction}</Box> : null}
    </Stack>
  );

  const sharedSx = {
    textAlign: "center",
    width: "100%",
  } as const;

  if (surface === "card") {
    return (
      <SectionCard
        aria-live={tone.ariaLive}
        data-variant={variant}
        role={tone.role}
        sx={[
          sharedSx,
          {
            py: { xs: 4, sm: 5 },
          },
          ...(Array.isArray(sx) ? sx : [sx]),
        ]}
      >
        {content}
      </SectionCard>
    );
  }

  return (
    <Box
      aria-live={tone.ariaLive}
      data-variant={variant}
      role={tone.role}
      sx={[
        sharedSx,
        {
          mx: "auto",
          px: { xs: 2, sm: 3 },
          py: { xs: 5, sm: 6 },
          maxWidth: 430,
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {content}
    </Box>
  );
}
