"use client";

import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";

import { PrimaryActionButton } from "atoms/ui/PrimaryActionButton/PrimaryActionButton";
import { designTokens } from "theme/theme";

type WizardActionBarButton = {
  disabled?: boolean;
  label: string;
  onClick: () => void;
};

export type WizardActionBarNextButton = {
  disabled?: boolean;
  /** 关联的 form 元素 ID。按钮在 form 外部时用于提交该表单。 */
  form?: string;
  label: string;
  /** 处理中：显示 CircularProgress 并禁用按钮。 */
  loading?: boolean;
  /** 处理中时 CircularProgress 的无障碍名称。 */
  loadingLabel?: string;
  onClick?: () => void;
  type?: "button" | "submit";
};

export type WizardActionBarProps = {
  next: WizardActionBarNextButton;
  /** 「上一步」描边胶囊按钮；省略时「下一步」占满宽度。 */
  previous?: WizardActionBarButton;
  /** 位于操作栏上方的「跳过此步」文字按钮。 */
  skip?: WizardActionBarButton;
};

/** 分步骤流程底部固定操作栏。按钮组合、文字与 loading / disabled 状态由各步骤通过 props 控制。 */
export function WizardActionBar({
  next,
  previous,
  skip,
}: WizardActionBarProps) {
  const nextLoading = next.loading ?? false;
  const loadingLabel = next.loadingLabel ?? next.label;

  return (
    <Stack spacing={0.75} sx={actionBarSx}>
      {skip ? (
        <Button
          disabled={skip.disabled}
          onClick={skip.onClick}
          sx={skipButtonSx}
          type="button"
          variant="text"
        >
          {skip.label}
        </Button>
      ) : null}
      <Stack direction="row" spacing={1.5}>
        {previous ? (
          <Button
            disabled={previous.disabled}
            fullWidth
            onClick={previous.onClick}
            sx={previousButtonSx}
            type="button"
            variant="outlined"
          >
            {previous.label}
          </Button>
        ) : null}
        <PrimaryActionButton
          aria-label={nextLoading ? loadingLabel : undefined}
          disabled={next.disabled || nextLoading}
          form={next.form}
          fullWidth
          onClick={next.onClick}
          type={next.type ?? "button"}
        >
          {nextLoading ? (
            <CircularProgress
              aria-label={loadingLabel}
              color="inherit"
              size={22}
            />
          ) : (
            next.label
          )}
        </PrimaryActionButton>
      </Stack>
    </Stack>
  );
}

const actionBarSx = {
  bgcolor: "background.paper",
  borderColor: "divider",
  borderTop: "1px solid",
  pb: "calc(12px + env(safe-area-inset-bottom))",
  pt: 1.2,
  px: { xs: 2, sm: 3 },
};

const skipButtonSx = {
  alignSelf: "center",
  color: "text.secondary",
  fontWeight: 700,
  minHeight: 40,
};

const previousButtonSx = {
  borderColor: "var(--user-theme-action-text)",
  borderRadius: `${designTokens.radius.full}px`,
  color: "text.secondary",
  fontWeight: 900,
  minHeight: 48,
};
