"use client";

import Box from "@mui/material/Box";
import Button, { type ButtonProps } from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import type { ElementType } from "react";

import { designTokens } from "theme/theme";

import { usePendingIndicator } from "./usePendingIndicator";

export type ActionButtonProps<C extends ElementType = "button"> = Omit<
  ButtonProps<C>,
  "loading" | "loadingIndicator" | "loadingPosition"
> & {
  /** 请求一开始立即禁止连点，不与真的 disabled 共用灰色外观。 */
  pending?: boolean;
  pendingLabel?: string;
};

/** 共用异步操作按钮：原色锁定、延迟加载、保持宽度和按下反馈。 */
export function ActionButton<C extends ElementType = "button">({
  children,
  color,
  disabled,
  pending = false,
  pendingLabel,
  sx,
  "aria-label": ariaLabel,
  ...props
}: ActionButtonProps<C>) {
  const visible = usePendingIndicator(pending);
  const blocked = pending || visible;
  const tone = color ?? "primary";
  const activeColor = tone === "inherit" ? "text.primary" : `${tone}.main`;
  const textColor =
    tone === "inherit" ? "text.primary" : `${tone}.contrastText`;

  return (
    <Button
      {...props}
      aria-busy={blocked ? "true" : undefined}
      aria-label={blocked && pendingLabel ? pendingLabel : ariaLabel}
      color={color}
      data-action-pending={blocked ? "true" : undefined}
      disabled={disabled || blocked}
      loading={visible}
      loadingIndicator={
        <CircularProgress color="inherit" size={18} aria-label={pendingLabel} />
      }
      loadingPosition="start"
      sx={[
        pressFeedbackSx,
        {
          "&&[data-action-pending='true'].Mui-disabled.MuiButton-contained": {
            bgcolor: activeColor,
            color: textColor,
            opacity: 1,
          },
          "&&[data-action-pending='true'].Mui-disabled.MuiButton-outlined": {
            borderColor: activeColor,
            color: activeColor,
            opacity: 1,
          },
          "&&[data-action-pending='true'].Mui-disabled.MuiButton-text": {
            color: activeColor,
            opacity: 1,
          },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {pendingLabel ? (
        <Box
          component="span"
          data-action-button-content=""
          sx={{
            display: "inline-grid",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          <Box
            component="span"
            aria-hidden={visible}
            sx={{
              gridArea: "1 / 1",
              whiteSpace: "nowrap",
              visibility: visible ? "hidden" : "visible",
            }}
          >
            {children}
          </Box>
          <Box
            component="span"
            aria-hidden={!visible}
            sx={{
              gridArea: "1 / 1",
              pl: 3,
              whiteSpace: "nowrap",
              visibility: visible ? "visible" : "hidden",
            }}
          >
            {pendingLabel}
          </Box>
        </Box>
      ) : (
        children
      )}
    </Button>
  );
}

const pressFeedbackSx = {
  transition: `transform ${designTokens.motion.actionButton.press}ms ease, filter ${designTokens.motion.actionButton.press}ms ease`,
  "&&:active:not(.Mui-disabled)": {
    filter: "brightness(0.94)",
    transform: "scale(0.97)",
  },
  "@media (prefers-reduced-motion: reduce)": {
    transition: "none",
    "&&:active:not(.Mui-disabled)": { transform: "none" },
  },
} as const;
