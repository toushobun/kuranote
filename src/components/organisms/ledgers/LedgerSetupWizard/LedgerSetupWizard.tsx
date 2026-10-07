"use client";

import BookmarkRoundedIcon from "@mui/icons-material/BookmarkRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import IconButton from "@mui/material/IconButton";
import { useTheme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useId } from "react";

import { ledgerSetupWizardMessages } from "config/ledgerSetupMessages";
import { ActionPromptDialog } from "molecules/ui/OperationFeedbackDialogs";
import { StepProgress } from "molecules/ui/StepProgress/StepProgress";
import type { LedgerBasicInfoValues } from "organisms/ledgers/LedgerBasicInfoFields/LedgerBasicInfoFields";
import { LedgerSetupCompleteScreen } from "organisms/ledgers/LedgerSetupCompleteScreen/LedgerSetupCompleteScreen";
import { designTokens } from "theme/theme";
import type { LedgerSetupProgress } from "types/ledgers";

import { ledgerSetupWizardSteps } from "./ledgerSetupWizardSteps";
import type { LedgerSetupWizardActions } from "./ledgerSetupWizardStepTypes";
import { useLedgerSetupWizard } from "./useLedgerSetupWizard";

const stepLabels = ledgerSetupWizardSteps.map(({ label }) => label);
const closeConfirmMessages = ledgerSetupWizardMessages.closeConfirm;

type LedgerSetupWizardProps = {
  actions: LedgerSetupWizardActions;
  /** 确认一览展示的默认大分类名称（按排序）。 */
  defaultRootCategoryNames: readonly string[];
  defaults: LedgerBasicInfoValues;
  /** 打开时显示在顶部提示条的内容（例如已有创建中账本时的提示）。 */
  initialNotice?: string | null;
  onClose: () => void;
  open: boolean;
  /** 打开时的创建中账本进度；有进度时恢复到上次的步骤。 */
  progress: LedgerSetupProgress | null;
};

/**
 * 创建账本向导骨架：移动端（xs）全屏、桌面端（sm 以上）居中弹框。
 * 负责顶部标题与步骤进度、当前步骤状态与切换、关闭确认；步骤内容见 ledgerSetupWizardSteps。
 * 第 6 步「完成」后显示完成页（不属于步骤注册表，不显示标题与进度条）。
 */
export function LedgerSetupWizard({
  actions,
  defaultRootCategoryNames,
  defaults,
  initialNotice = null,
  onClose,
  open,
  progress: initialProgress,
}: LedgerSetupWizardProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const titleId = useId();
  const wizard = useLedgerSetupWizard({
    initialNotice,
    initialProgress,
    onClose,
  });
  const { Component: StepComponent, key, label } = wizard.currentStep;

  return (
    <>
      <Dialog
        aria-labelledby={titleId}
        fullScreen={fullScreen}
        fullWidth
        maxWidth={false}
        onClose={wizard.requestClose}
        open={open}
        slotProps={{ paper: { sx: getLedgerSetupWizardPaperSx(fullScreen) } }}
      >
        {wizard.completeScreen ? (
          <>
            {/* 完成页：不显示标题与进度条，只保留右上角「×」。 */}
            <Box sx={completeHeaderSx}>
              <IconButton
                aria-label={ledgerSetupWizardMessages.close}
                onClick={wizard.requestClose}
              >
                <CloseRoundedIcon />
              </IconButton>
            </Box>
            <LedgerSetupCompleteScreen
              completion={wizard.completeScreen}
              onClose={wizard.requestClose}
              titleId={titleId}
            />
          </>
        ) : (
          <>
            <Box sx={headerSx}>
              <Box sx={titleRowSx}>
                <IconButton
                  aria-label={ledgerSetupWizardMessages.close}
                  disabled={wizard.busy}
                  onClick={wizard.requestClose}
                >
                  <CloseRoundedIcon />
                </IconButton>
                <Typography component="h2" id={titleId} sx={titleSx}>
                  {ledgerSetupWizardMessages.title}
                </Typography>
              </Box>
              <StepProgress
                currentStep={wizard.step}
                label={ledgerSetupWizardMessages.progressLabel}
                steps={stepLabels}
              />
              {wizard.notice ? (
                <Alert
                  closeText={ledgerSetupWizardMessages.dismissNotice}
                  onClose={wizard.dismissNotice}
                  role="status"
                  severity="info"
                  sx={noticeSx}
                >
                  {wizard.notice}
                </Alert>
              ) : null}
            </Box>
            <StepComponent
              actions={actions}
              defaultRootCategoryNames={defaultRootCategoryNames}
              defaults={defaults}
              key={`${key}:${wizard.progress?.setup.id ?? "new"}:${wizard.progressRevision}`}
              onBusyChange={wizard.setBusy}
              onFinish={wizard.finish}
              onGoToStep={wizard.goToStep}
              onNext={wizard.goNext}
              onPrevious={wizard.goPrevious}
              onProgressChange={wizard.updateProgress}
              onProgressRefresh={wizard.refreshProgress}
              onRestore={wizard.restoreProgress}
              onSetupCompleted={wizard.markSetupCompleted}
              onSetupUnavailable={wizard.markSetupUnavailable}
              progress={wizard.progress}
              step={wizard.step}
              stepLabel={label}
            />
          </>
        )}
      </Dialog>

      <ActionPromptDialog
        description={closeConfirmMessages.description}
        icon={<BookmarkRoundedIcon />}
        onClose={wizard.continueSetup}
        onPrimary={wizard.continueSetup}
        onSecondary={wizard.closeLater}
        open={wizard.closeConfirmOpen}
        primaryLabel={closeConfirmMessages.continue}
        secondaryLabel={closeConfirmMessages.later}
        title={closeConfirmMessages.title}
      />
    </>
  );
}

/** 向导弹框的 Paper 样式。入口在读取向导数据期间显示的弹框共用，避免打开后尺寸跳动。 */
export function getLedgerSetupWizardPaperSx(fullScreen: boolean) {
  return fullScreen ? fullScreenPaperSx : paperSx;
}

const paperSx = {
  borderRadius: `${designTokens.radius.xl}px`,
  height: "min(760px, calc(100% - 64px))",
  maxWidth: 560,
  overflow: "hidden",
};

const fullScreenPaperSx = {
  overflow: "hidden",
};

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

const noticeSx = {
  borderRadius: `${designTokens.radius.item}px`,
  mt: 1.5,
  mx: 1,
};

const titleSx = {
  color: "text.primary",
  fontSize: 17,
  fontWeight: 900,
  textAlign: "center",
};
