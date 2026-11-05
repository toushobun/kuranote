"use client";

import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import {
  ledgerSetupMerchantsMessages,
  ledgerSetupWizardMessages,
} from "config/ledgerSetupMessages";
import { EmptyState } from "molecules/ui/EmptyState";
import { MerchantPresetSelector } from "organisms/merchants/MerchantPresetSelector/MerchantPresetSelector";
import { ActionFailureFeedback } from "molecules/ui/OperationFeedbackDialogs";
import { WizardActionBar } from "molecules/ui/WizardActionBar/WizardActionBar";
import { WizardStepLayout } from "molecules/ui/WizardDialog/WizardStepLayout";
import type { LedgerSetupWizardStepProps } from "organisms/ledgers/LedgerSetupWizard/ledgerSetupWizardStepTypes";
import { typographyStyles } from "theme/typographyTokens";
import type { LedgerSetupProgress } from "types/ledgers";

import { useLedgerSetupMerchantsStep } from "./useLedgerSetupMerchantsStep";

/**
 * 向导第 3 步「商家」：按商家标签分组两层勾选预设商家。勾选以商家为单位保存到草稿。
 * 第 3 步只能在第 1 步创建账本后进入，因此始终有进度。
 */
export function LedgerSetupMerchantsStep({
  progress,
  ...props
}: LedgerSetupWizardStepProps) {
  if (!progress) return null;

  return <LedgerSetupMerchantsStepContent {...props} progress={progress} />;
}

function LedgerSetupMerchantsStepContent(
  props: Omit<LedgerSetupWizardStepProps, "progress"> & {
    progress: LedgerSetupProgress;
  },
) {
  const step = useLedgerSetupMerchantsStep(props);
  const { checklist } = step;

  return (
    <WizardStepLayout
      actions={
        <WizardActionBar
          next={{
            label:
              step.selectedCount > 0
                ? ledgerSetupMerchantsMessages.nextWithCount(step.selectedCount)
                : ledgerSetupWizardMessages.next,
            loading: step.isSaving,
            loadingLabel: ledgerSetupWizardMessages.submitting,
            onClick: step.goNext,
          }}
          previous={{
            disabled: step.isSaving,
            label: ledgerSetupWizardMessages.previous,
            onClick: step.goPrevious,
          }}
          // 没有预设商家时无可跳过的内容，下一步即按跳过保存。
          skip={
            checklist
              ? {
                  disabled: step.isSaving,
                  label: ledgerSetupWizardMessages.skip,
                  onClick: step.skip,
                }
              : undefined
          }
        />
      }
    >
      <Stack spacing={2}>
        <Stack spacing={0.75}>
          <Typography component="h3" sx={titleSx}>
            {ledgerSetupMerchantsMessages.title}
          </Typography>
          <Typography color="textSecondary" variant="body2">
            {ledgerSetupMerchantsMessages.description}
          </Typography>
        </Stack>

        {checklist ? (
          <MerchantPresetSelector
            region={props.progress.setup.livingRegion}
            additionalRegions={step.additionalRegions}
            onAdditionalRegionsChange={step.setAdditionalRegions}
            onRequestRegionChange={step.changeRegion}
            onRegionChange={() => step.changeRegion()}
            disabled={step.isSaving}
            groups={checklist.groups}
            items={checklist.items}
            onChange={step.setSelectedKeys}
            selectedKeys={step.selectedKeys}
          />
        ) : (
          <EmptyState
            description={ledgerSetupMerchantsMessages.noTemplate.description}
            title={ledgerSetupMerchantsMessages.noTemplate.title}
          />
        )}
      </Stack>

      <ActionFailureFeedback
        state={step.failureState}
        title={ledgerSetupWizardMessages.saveErrorTitle}
      />
    </WizardStepLayout>
  );
}

const titleSx = {
  ...typographyStyles.cardTitle,
  fontSize: 20,
  fontWeight: 900,
};
