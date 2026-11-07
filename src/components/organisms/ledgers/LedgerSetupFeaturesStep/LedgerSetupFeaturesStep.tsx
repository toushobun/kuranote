"use client";

import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import {
  ledgerSetupFeaturesMessages,
  ledgerSetupWizardMessages,
} from "config/ledgerSetupMessages";
import { WizardActionBar } from "molecules/ui/WizardActionBar/WizardActionBar";
import { WizardStepLayout } from "molecules/ui/WizardDialog/WizardStepLayout";
import type { LedgerSetupWizardStepProps } from "organisms/ledgers/LedgerSetupWizard/ledgerSetupWizardStepTypes";
import { LedgerMultiAccountPaymentSetting } from "organisms/ledgers/LedgerMultiAccountPaymentSetting/LedgerMultiAccountPaymentSetting";
import { LedgerSpecialStatusSetting } from "organisms/ledgers/LedgerSpecialStatusSetting/LedgerSpecialStatusSetting";
import { typographyStyles } from "theme/typographyTokens";

export function LedgerSetupFeaturesStep({
  progress,
  onNext,
  onPrevious,
  onProgressChange,
}: LedgerSetupWizardStepProps) {
  if (!progress) return null;
  const current = progress;
  const { draft } = current.setup;
  function update(features: typeof draft.features) {
    onProgressChange({
      ...current,
      setup: {
        ...current.setup,
        draft: { ...draft, features },
      },
    });
  }

  return (
    <WizardStepLayout
      actions={
        <WizardActionBar
          next={{
            label: ledgerSetupWizardMessages.next,
            onClick: onNext,
          }}
          previous={{
            label: ledgerSetupWizardMessages.previous,
            onClick: onPrevious,
          }}
        />
      }
    >
      <Stack spacing={2.5}>
        <Stack spacing={0.75}>
          <Typography component="h3" sx={titleSx}>
            {ledgerSetupFeaturesMessages.title}
          </Typography>
          <Typography color="textSecondary" variant="body2">
            {ledgerSetupFeaturesMessages.description}
          </Typography>
        </Stack>
        <LedgerSpecialStatusSetting
          disabledDescription={null}
          enabled={draft.features.specialStatusEnabled}
          onChange={(specialStatusEnabled) =>
            update({ ...draft.features, specialStatusEnabled })
          }
        />
        <LedgerMultiAccountPaymentSetting
          enabled={draft.features.multiAccountPaymentEnabled}
          enabledDescription={null}
          onChange={(multiAccountPaymentEnabled) =>
            update({ ...draft.features, multiAccountPaymentEnabled })
          }
        />
      </Stack>
    </WizardStepLayout>
  );
}

const titleSx = {
  ...typographyStyles.cardTitle,
  fontSize: 20,
  fontWeight: 900,
};
