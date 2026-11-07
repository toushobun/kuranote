"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import { useId, useState } from "react";
import { ActionFailureFeedback } from "molecules/ui/OperationFeedbackDialogs";
import { createErrorState } from "internal/shared/adapter/next/actionState";
import {
  validateLedgerSetupBasicInfoForm,
  ledgerCreateErrorMessages,
  ledgerSetupErrorCodes,
  ledgerSetupErrorMessages,
  ledgerSetupWriteErrorMessages,
} from "internal/ledger";
import type { ActionState } from "types/actions";
import { BackLayerScope } from "molecules/ui/UnsavedChangesDialog/BackLayerScope";
import { UnsavedChangesDialog } from "molecules/ui/UnsavedChangesDialog/UnsavedChangesDialog";
import { useUnsavedChangesGuard } from "molecules/ui/UnsavedChangesDialog/useUnsavedChangesGuard";
import { WizardDialog } from "molecules/ui/WizardDialog/WizardDialog";

import {
  ledgerSetupEntryMessages,
  ledgerSetupWizardMessages,
} from "config/ledgerSetupMessages";
import { StepProgress } from "molecules/ui/StepProgress/StepProgress";
import { LedgerSetupAbandonButton } from "organisms/ledgers/LedgerSetupAbandonButton/LedgerSetupAbandonButton";
import type { LedgerBasicInfoValues } from "organisms/ledgers/LedgerBasicInfoFields/LedgerBasicInfoFields";
import { LedgerSetupCompleteScreen } from "organisms/ledgers/LedgerSetupCompleteScreen/LedgerSetupCompleteScreen";
import { designTokens } from "theme/theme";
import type { LedgerSetupProgress } from "types/ledgers";

import { ledgerSetupWizardSteps } from "./ledgerSetupWizardSteps";
import type { LedgerSetupWizardActions } from "./ledgerSetupWizardStepTypes";
import {
  useLedgerSetupWizard,
  type LedgerSetupWizardNotice,
} from "./useLedgerSetupWizard";

const wizardLayer = 0;

const stepLabels = ledgerSetupWizardSteps.map(({ label }) => label);

type LedgerSetupWizardProps = {
  actions: LedgerSetupWizardActions;
  /** 确认一览展示的默认大分类名称（按排序）。 */
  defaultRootCategoryNames: readonly string[];
  defaults: LedgerBasicInfoValues;
  /** 打开时显示在顶部提示条的内容（例如已有创建中账本时的提示）。 */
  initialNotice?: LedgerSetupWizardNotice | null;
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
    defaults,
  });
  const [validationError, setValidationError] = useState<string | null>(null);
  const [failureState, setFailureState] = useState<ActionState>({});
  const [abandoning, setAbandoning] = useState(false);
  const draft = wizard.notice === "draft" ? wizard.savedProgress?.setup : null;
  const busy = wizard.busy || abandoning;
  const unfinished = wizard.step <= 5 && !wizard.completeScreen;

  function validateBasicInfo(): boolean {
    const { setup } = wizard.progress;
    const form = new FormData();
    form.set("ledgerId", setup.id);
    form.set("ledgerName", setup.name);
    form.set("baseCurrency", setup.baseCurrency);
    form.set("memberDisplayName", setup.displayName);
    form.set("memberDisplayColor", setup.displayColor);
    form.set("livingRegion", setup.livingRegion ?? "");
    const validation = validateLedgerSetupBasicInfoForm(form);
    if (validation.ok) {
      setValidationError(null);
      return true;
    }
    const messages = {
      ...ledgerCreateErrorMessages,
      ...ledgerSetupErrorMessages,
    };
    setValidationError(messages[validation.error]);
    wizard.goToBasicInfo();
    return false;
  }

  async function persist(complete: boolean): Promise<boolean> {
    if (!validateBasicInfo()) return false;
    wizard.setBusy(true);
    try {
      const state = await actions.persistSetup({
        setup: wizard.getPersistableSetup(),
        expectedUpdatedAt: wizard.savedProgress?.setup.updatedAt ?? null,
        step: Math.min(wizard.step, 5),
        complete,
      });
      if (state.refreshedTemplate) {
        wizard.refreshTemplate(state.refreshedTemplate);
        setFailureState({});
        return false;
      }
      if (!state.updatedAt || (complete && !state.completed)) {
        setFailureState(
          state.error
            ? state
            : createErrorState(
                complete
                  ? ledgerSetupWriteErrorMessages.completeFailed
                  : ledgerSetupWriteErrorMessages.draftSaveFailed,
              ),
        );
        return false;
      }
      setFailureState({});
      if (complete) {
        wizard.markSetupCompleted();
      }
      return true;
    } catch {
      setFailureState(
        createErrorState(
          complete
            ? ledgerSetupWriteErrorMessages.completeFailed
            : ledgerSetupWriteErrorMessages.draftSaveFailed,
        ),
      );
      return false;
    } finally {
      wizard.setBusy(false);
    }
  }

  const guard = useUnsavedChangesGuard({
    active: open,
    disabled: busy,
    isDirty: unfinished && wizard.dirty,
    confirmOnLeave: unfinished,
    layer: wizardLayer,
    onClose,
    saveFormId: null,
    saveOnLeave: () => persist(false),
    saveLabel: ledgerSetupWizardMessages.saveAndExit,
    cleanDescription: ledgerSetupWizardMessages.cleanExitDescription,
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
        disabled={busy}
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
              {draft || wizard.notice === "templateUpdated" ? (
                <Alert
                  closeText={ledgerSetupWizardMessages.dismissNotice}
                  onClose={wizard.dismissNotice}
                  slotProps={{ closeButton: { disabled: abandoning } }}
                  role="status"
                  severity="info"
                  sx={noticeSx}
                >
                  {wizard.notice === "templateUpdated"
                    ? ledgerSetupErrorMessages[
                        ledgerSetupErrorCodes.templateOutdated
                      ]
                    : ledgerSetupEntryMessages.draftNotice}
                  {draft ? (
                    <LedgerSetupAbandonButton
                      action={actions.abandonSetup}
                      disabled={busy}
                      ledgerId={draft.id}
                      ledgerName={draft.name}
                      onBusyChange={setAbandoning}
                      onSuccess={() => {
                        setAbandoning(false);
                        wizard.resetDraft();
                      }}
                      restart
                    />
                  ) : null}
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
          <Box
            component="fieldset"
            disabled={abandoning}
            sx={{ display: "contents" }}
          >
            <StepComponent
              actions={actions}
              defaultRootCategoryNames={defaultRootCategoryNames}
              defaults={defaults}
              key={`${key}:${wizard.progressRevision}`}
              onBusyChange={wizard.setBusy}
              onFinish={wizard.finish}
              onGoToStep={wizard.goToStep}
              onNext={wizard.goNext}
              onPrevious={wizard.goPrevious}
              onProgressChange={wizard.updateProgress}
              onComplete={() => persist(true)}
              validationError={validationError}
              progress={wizard.progress}
              step={wizard.step}
              stepLabel={label}
            />
          </Box>
        )}
      </WizardDialog>

      <UnsavedChangesDialog {...guard.dialogProps} />
      <ActionFailureFeedback
        state={failureState}
        title={ledgerSetupWizardMessages.saveErrorTitle}
      />
    </>
  );
}

const noticeSx = {
  borderRadius: `${designTokens.radius.item}px`,
  mt: 1.5,
  mx: 1,
};
