"use client";

import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useState } from "react";

import {
  ledgerSetupFeaturesMessages,
  ledgerSetupWizardMessages,
} from "config/ledgerSetupMessages";
import { ActionFailureFeedback } from "molecules/ui/OperationFeedbackDialogs";
import { WizardActionBar } from "molecules/ui/WizardActionBar/WizardActionBar";
import { LedgerSetupStepLayout } from "organisms/ledgers/LedgerSetupWizard/LedgerSetupStepLayout";
import type { LedgerSetupWizardStepProps } from "organisms/ledgers/LedgerSetupWizard/ledgerSetupWizardStepTypes";
import { useLedgerSetupDraftSave } from "organisms/ledgers/LedgerSetupWizard/useLedgerSetupDraftSave";
import { LedgerSpecialStatusSetting } from "organisms/ledgers/LedgerSpecialStatusSetting/LedgerSpecialStatusSetting";
import { typographyStyles } from "theme/typographyTokens";
import type { LedgerSetupProgress } from "types/ledgers";

/**
 * 向导第 4 步「功能」：复用账本设置页的明细特殊状态开关，选择保存到草稿。
 * 第 4 步只能在第 1 步创建账本后进入，因此始终有进度。
 */
export function LedgerSetupFeaturesStep({
  progress,
  ...props
}: LedgerSetupWizardStepProps) {
  if (!progress) return null;

  return <LedgerSetupFeaturesStepContent {...props} progress={progress} />;
}

function LedgerSetupFeaturesStepContent(
  props: Omit<LedgerSetupWizardStepProps, "progress"> & {
    progress: LedgerSetupProgress;
  },
) {
  const { draft } = props.progress.setup;
  const draftSave = useLedgerSetupDraftSave(props);
  const [specialStatusEnabled, setSpecialStatusEnabled] = useState(
    draft.features.specialStatusEnabled,
  );
  const nextDraft = { ...draft, features: { specialStatusEnabled } };

  return (
    <LedgerSetupStepLayout
      actions={
        <WizardActionBar
          next={{
            label: ledgerSetupWizardMessages.next,
            loading: draftSave.isSaving,
            loadingLabel: ledgerSetupWizardMessages.submitting,
            onClick: () => void draftSave.saveAndGoNext(nextDraft),
          }}
          previous={{
            disabled: draftSave.isSaving,
            label: ledgerSetupWizardMessages.previous,
            onClick: () => void draftSave.saveAndGoPrevious(nextDraft),
          }}
        />
      }
    >
      <Stack spacing={2.5}>
        <Stack spacing={0.75}>
          <Typography component="h3" sx={titleSx}>
            {ledgerSetupFeaturesMessages.title}
          </Typography>
          <Typography color="text.secondary" variant="body2">
            {ledgerSetupFeaturesMessages.description}
          </Typography>
        </Stack>

        {/* 新账本还没有明细，关闭状态下「处于报销流程的明细将无法关闭」的说明不适用。 */}
        <LedgerSpecialStatusSetting
          disabledDescription={null}
          enabled={specialStatusEnabled}
          onChange={setSpecialStatusEnabled}
        />
      </Stack>

      <ActionFailureFeedback
        state={draftSave.failureState}
        title={ledgerSetupWizardMessages.saveErrorTitle}
      />
    </LedgerSetupStepLayout>
  );
}

const titleSx = {
  ...typographyStyles.cardTitle,
  fontSize: 20,
  fontWeight: 900,
};
