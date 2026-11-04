"use client";

import Alert from "@mui/material/Alert";
import { useId, useState } from "react";
import { BackLayerScope } from "molecules/ui/UnsavedChangesDialog/BackLayerScope";
import { UnsavedChangesDialog } from "molecules/ui/UnsavedChangesDialog/UnsavedChangesDialog";
import { useUnsavedChangesGuard } from "molecules/ui/UnsavedChangesDialog/useUnsavedChangesGuard";
import { WizardDialog } from "molecules/ui/WizardDialog/WizardDialog";

import { ledgerSetupWizardMessages } from "config/ledgerSetupMessages";
import { StepProgress } from "molecules/ui/StepProgress/StepProgress";
import type { LedgerBasicInfoValues } from "organisms/ledgers/LedgerBasicInfoFields/LedgerBasicInfoFields";
import { LedgerSetupCompleteScreen } from "organisms/ledgers/LedgerSetupCompleteScreen/LedgerSetupCompleteScreen";
import { designTokens } from "theme/theme";
import type { LedgerSetupProgress } from "types/ledgers";

import { ledgerSetupWizardSteps } from "./ledgerSetupWizardSteps";
import type { LedgerSetupWizardActions } from "./ledgerSetupWizardStepTypes";
import { useLedgerSetupWizard } from "./useLedgerSetupWizard";

const wizardLayer = 0;

const stepLabels = ledgerSetupWizardSteps.map(({ label }) => label);

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
export function LedgerSetupWizard(props: LedgerSetupWizardProps) {
  return (
    <BackLayerScope level={wizardLayer}>
      <LedgerSetupWizardContent {...props} />
    </BackLayerScope>
  );
}

function LedgerSetupWizardContent({
  actions,
  defaultRootCategoryNames,
  defaults,
  initialNotice,
  onClose,
  open,
  progress: initialProgress,
}: LedgerSetupWizardProps) {
  const titleId = useId();
  const wizard = useLedgerSetupWizard({
    initialNotice,
    initialProgress,
  });
  const [dirty, setDirty] = useState(false);
  const guard = useUnsavedChangesGuard({
    active: open,
    disabled: wizard.busy,
    isDirty: dirty,
    layer: wizardLayer,
    onClose,
    saveFormId: null,
  });
  const { Component: StepComponent, key, label } = wizard.currentStep;

  return (
    <>
      <WizardDialog
        titleId={titleId}
        title={
          wizard.completeScreen ? undefined : ledgerSetupWizardMessages.title
        }
        closeLabel={ledgerSetupWizardMessages.close}
        disabled={wizard.busy}
        onClose={guard.requestClose}
        open={open}
        headerContent={
          wizard.completeScreen ? undefined : (
            <>
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
            </>
          )
        }
      >
        {wizard.completeScreen ? (
          <LedgerSetupCompleteScreen
            completion={wizard.completeScreen}
            onClose={guard.requestClose}
            titleId={titleId}
          />
        ) : (
          <StepComponent
            actions={actions}
            defaultRootCategoryNames={defaultRootCategoryNames}
            defaults={defaults}
            key={`${key}:${wizard.progress?.setup.id ?? "new"}:${wizard.progressRevision}`}
            onBusyChange={wizard.setBusy}
            onDirtyChange={setDirty}
            onFinish={wizard.finish}
            onGoToStep={wizard.goToStep}
            onNext={wizard.goNext}
            onPrevious={wizard.goPrevious}
            onProgressChange={wizard.updateProgress}
            onProgressRefresh={wizard.refreshProgress}
            onRestore={wizard.restoreProgress}
            onSetupCompleted={wizard.markSetupCompleted}
            progress={wizard.progress}
            step={wizard.step}
            stepLabel={label}
          />
        )}
      </WizardDialog>

      <UnsavedChangesDialog {...guard.dialogProps} />
    </>
  );
}

const noticeSx = {
  borderRadius: `${designTokens.radius.item}px`,
  mt: 1.5,
  mx: 1,
};
