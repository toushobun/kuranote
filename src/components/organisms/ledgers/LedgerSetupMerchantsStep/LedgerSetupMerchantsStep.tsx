"use client";

import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import {
  ledgerSetupMerchantsMessages,
  ledgerSetupWizardMessages,
} from "config/ledgerSetupMessages";
import { EmptyState } from "molecules/ui/EmptyState";
import { MerchantPresetSelector } from "organisms/merchants/MerchantPresetSelector/MerchantPresetSelector";
import { WizardActionBar } from "molecules/ui/WizardActionBar/WizardActionBar";
import { WizardStepLayout } from "molecules/ui/WizardDialog/WizardStepLayout";
import type { LedgerSetupWizardStepProps } from "organisms/ledgers/LedgerSetupWizard/ledgerSetupWizardStepTypes";
import { typographyStyles } from "theme/typographyTokens";

import { useLedgerSetupMerchantsStep } from "./useLedgerSetupMerchantsStep";

/**
 * 向导第 3 步「商家」：按商家标签分组两层勾选预设商家。勾选以商家为单位保存到草稿。
 */
export function LedgerSetupMerchantsStep(props: LedgerSetupWizardStepProps) {
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
            onClick: step.goNext,
          }}
          previous={{
            label: ledgerSetupWizardMessages.previous,
            onClick: props.onPrevious,
          }}
        />
      }
    >
      <Stack spacing={1}>
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
    </WizardStepLayout>
  );
}

const titleSx = {
  ...typographyStyles.cardTitle,
  fontSize: 20,
  fontWeight: 900,
};
