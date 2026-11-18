"use client";

import Box from "@mui/material/Box";
import Button, { type ButtonProps } from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import type { ElementType, MouseEvent } from "react";

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
  startIcon,
  endIcon,
  pending = false,
  pendingLabel,
  sx,
  "aria-label": ariaLabel,
  ...props
}: ActionButtonProps<C>) {
  const visible = usePendingIndicator(pending);
  const blocked = pending || visible;
  const hasIcon = Boolean(startIcon || endIcon);
  const iconIndicator = (
    <CircularProgress color="inherit" size={props.size === "small" ? 18 : 20} />
  );
  const tone = color ?? "primary";
  const activeColor = tone === "inherit" ? "text.primary" : `${tone}.main`;
  const textColor =
    tone === "inherit" ? "text.primary" : `${tone}.contrastText`;

  return (
    <Button
      {...props}
      // 链接没有原生 disabled，键盘或脚本触发时仍需显式阻止跳转和回调。
      {...(blocked || disabled
        ? {
            onClickCapture: (event: MouseEvent<HTMLElement>) => {
              event.preventDefault();
              event.stopPropagation();
            },
          }
        : {})}
      aria-busy={blocked ? "true" : undefined}
      aria-label={blocked && pendingLabel ? pendingLabel : ariaLabel}
      color={color}
      startIcon={startIcon ? (visible ? iconIndicator : startIcon) : undefined}
      endIcon={!startIcon && endIcon && visible ? iconIndicator : endIcon}
      data-action-pending={blocked ? "true" : undefined}
      disabled={disabled || blocked}
      loading={visible && !hasIcon}
      loadingIndicator={
        !hasIcon ? (
          <CircularProgress
            color="inherit"
            size={18}
            aria-label={pendingLabel}
          />
        ) : null
      }
      loadingPosition={pendingLabel ? "center" : "start"}
      sx={[
        pressFeedbackSx,
        ...(pendingLabel && !hasIcon ? [stableLoadingLayoutSx] : []),
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
              pl: hasIcon ? 0 : 3,
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

/**
 * 无图标按钮使用网格固定宽度；带图标按钮保留 MUI 原生 flex 排版，
 * 处理中将图标原位替换为进度指示器，避免额外的网格列导致换行。
 * MUI 9 的 loadingPosition="start" 会在加载后额外生成 startIcon，
 * 对于非 fullWidth 按钮会改变宽度。用同一网格轨道放置加载图标和双文案，
 * 既使用 MUI 自带 loading，又保证任何宽度下不会跳动。
 */
const stableLoadingLayoutSx = {
  display: "inline-grid",
  gridTemplateColumns: "max-content",
  justifyContent: "center",
  alignItems: "center",
  "& .MuiButton-loadingIndicator": {
    gridArea: "1 / 1",
    position: "relative",
    left: "auto",
    transform: "none",
    justifySelf: "start",
    color: "inherit",
  },
  "& [data-action-button-content]": {
    gridArea: "1 / 1",
  },
} as const;
