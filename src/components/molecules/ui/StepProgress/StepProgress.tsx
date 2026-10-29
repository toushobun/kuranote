import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import ButtonBase from "@mui/material/ButtonBase";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

const stepProgressText = {
  completed: "已完成",
  upcoming: "未开始",
} as const;

export type StepProgressStatus = "completed" | "current" | "upcoming";

type StepProgressProps = {
  /** 当前步骤，从 1 开始。 */
  currentStep: number;
  label: string;
  steps: readonly string[];
  /** 每一步步骤名下方的第二行文字（如已选内容），未传或为空时不显示。 */
  stepDetails?: readonly (string | undefined)[];
  completedSteps?: readonly number[];
  clickableSteps?: readonly number[];
  onStepClick?: (step: number) => void;
};

function getStepStatus(
  step: number,
  currentStep: number,
  completedSteps?: readonly number[],
): StepProgressStatus {
  if (step === currentStep) return "current";
  const completed = completedSteps
    ? completedSteps.includes(step)
    : step < currentStep;
  return completed ? "completed" : "upcoming";
}

/**
 * 分步骤流程的进度条：「圆点 + 连线 + 下方标签」。
 * 已完成为主题强调色实心圆点带对勾，当前步骤高亮并加粗标签，未到的步骤为浅灰。
 */
export function StepProgress({
  currentStep,
  label,
  steps,
  stepDetails,
  completedSteps,
  clickableSteps = [],
  onStepClick,
}: StepProgressProps) {
  return (
    <Box aria-label={label} component="ol" sx={listSx}>
      {steps.map((stepLabel, index) => {
        const step = index + 1;
        const status = getStepStatus(step, currentStep, completedSteps);
        const isLast = step === steps.length;
        const detail = stepDetails?.[index];
        // 连线左右任一侧的步骤已完成即为实线；不传 completedSteps 时与之前一致（当前步骤之前）。
        const connectorCompleted =
          status === "completed" ||
          getStepStatus(step + 1, currentStep, completedSteps) === "completed";
        const content = (
          <>
            <Box aria-hidden="true" component="span" sx={dotSx(status)}>
              {status === "completed" ? <CheckRoundedIcon /> : step}
            </Box>
            <Typography component="span" sx={labelSx(status)}>
              {stepLabel}
              {status === "current" ? null : (
                <Box component="span" sx={visuallyHiddenSx}>
                  （{stepProgressText[status]}）
                </Box>
              )}
            </Typography>
            {detail ? (
              <Typography component="span" sx={detailSx}>
                {detail}
              </Typography>
            ) : null}
          </>
        );

        return (
          <Box
            aria-current={status === "current" ? "step" : undefined}
            component="li"
            data-status={status}
            key={stepLabel}
            sx={itemSx}
          >
            {isLast ? null : (
              <Box
                aria-hidden="true"
                component="span"
                sx={connectorSx(connectorCompleted)}
              />
            )}
            {onStepClick && clickableSteps.includes(step) ? (
              <ButtonBase
                onClick={() => onStepClick(step)}
                aria-label={stepLabel}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 0.6,
                  width: "100%",
                  minHeight: 44,
                }}
              >
                {content}
              </ButtonBase>
            ) : (
              content
            )}
          </Box>
        );
      })}
    </Box>
  );
}

const dotSize = 24;

const visuallyHiddenSx = {
  border: 0,
  clip: "rect(0 0 0 0)",
  height: 1,
  margin: -1,
  overflow: "hidden",
  padding: 0,
  position: "absolute",
  whiteSpace: "nowrap",
  width: 1,
} as const;

const listSx = {
  display: "flex",
  listStyle: "none",
  m: 0,
  p: 0,
};

const itemSx = {
  alignItems: "center",
  display: "flex",
  flex: 1,
  flexDirection: "column",
  gap: 0.6,
  minWidth: 0,
  position: "relative",
};

function connectorSx(completed: boolean) {
  return {
    bgcolor: completed ? "var(--user-theme-action-text)" : "divider",
    height: 2,
    // 连线从当前圆点右侧连到下一个圆点左侧，两端各留 4px 间隙。
    left: `calc(50% + ${dotSize / 2 + 4}px)`,
    position: "absolute",
    right: `calc(-50% + ${dotSize / 2 + 4}px)`,
    top: dotSize / 2 - 1,
  } as const;
}

function dotSx(status: StepProgressStatus) {
  const isActive = status !== "upcoming";

  return {
    alignItems: "center",
    bgcolor: isActive ? "var(--user-theme-action-text)" : "action.hover",
    borderRadius: "50%",
    boxShadow:
      status === "current"
        ? "0 0 0 4px var(--user-theme-icon-badge-bg)"
        : "none",
    color: isActive ? "common.white" : "text.disabled",
    display: "inline-flex",
    flexShrink: 0,
    fontSize: 12,
    fontWeight: 900,
    height: dotSize,
    justifyContent: "center",
    position: "relative",
    width: dotSize,
    "& .MuiSvgIcon-root": {
      fontSize: 16,
    },
  } as const;
}

const detailSx = {
  color: "text.primary",
  fontSize: 13,
  lineHeight: 1.4,
  maxWidth: "100%",
  mt: -0.4,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
} as const;

function labelSx(status: StepProgressStatus) {
  return {
    color:
      status === "current"
        ? "text.primary"
        : status === "completed"
          ? "text.secondary"
          : "text.disabled",
    fontSize: 12,
    fontWeight: status === "current" ? 900 : 500,
    lineHeight: 1.4,
    maxWidth: "100%",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  } as const;
}
