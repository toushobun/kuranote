"use client";

import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { SoftCard } from "atoms/ui/SoftCard";
import {
  ledgerSetupBasicInfoMessages,
  ledgerSetupWizardMessages,
} from "config/ledgerSetupMessages";
import { ActionFailureFeedback } from "molecules/ui/OperationFeedbackDialogs";
import { WizardActionBar } from "molecules/ui/WizardActionBar/WizardActionBar";
import { LedgerBasicInfoFields } from "organisms/ledgers/LedgerBasicInfoFields/LedgerBasicInfoFields";
import { WizardStepLayout } from "molecules/ui/WizardDialog/WizardStepLayout";
import type { LedgerSetupWizardStepProps } from "organisms/ledgers/LedgerSetupWizard/ledgerSetupWizardStepTypes";
import { designTokens } from "theme/theme";
import { typographyStyles } from "theme/typographyTokens";

import { useLedgerSetupBasicInfoStep } from "./useLedgerSetupBasicInfoStep";
import { LedgerRegionField } from "molecules/ledgers/LedgerRegionField/LedgerRegionField";

const formId = "ledger-setup-basic-info-form";

/**
 * 第 1 步只做本地校验与切换；保存创建中进度由向导统一负责。
 */
export function LedgerSetupBasicInfoStep(props: LedgerSetupWizardStepProps) {
  const {
    actionState,
    handleSubmit,
    ledgerId,
    setValues,
    values,
    livingRegion,
    setLivingRegion,
  } = useLedgerSetupBasicInfoStep(props);

  return (
    <WizardStepLayout
      actions={
        <WizardActionBar
          next={{
            form: formId,
            label: ledgerSetupWizardMessages.next,
            type: "submit",
          }}
        />
      }
    >
      <Stack component="form" id={formId} onSubmit={handleSubmit} spacing={2.5}>
        <input name="ledgerId" type="hidden" value={ledgerId} />
        <Stack spacing={0.75}>
          <Typography component="h3" sx={titleSx}>
            {ledgerSetupBasicInfoMessages.title}
          </Typography>
          <Typography color="textSecondary" variant="body2">
            {ledgerSetupBasicInfoMessages.description}
          </Typography>
        </Stack>
        <SoftCard sx={cardSx}>
          <LedgerBasicInfoFields
            onChange={setValues}
            values={values}
            afterCurrency={
              <LedgerRegionField
                value={livingRegion}
                onChange={setLivingRegion}
              />
            }
          />
        </SoftCard>
      </Stack>

      <ActionFailureFeedback
        state={actionState}
        title={ledgerSetupBasicInfoMessages.errorTitle}
      />
    </WizardStepLayout>
  );
}

const titleSx = {
  ...typographyStyles.cardTitle,
  fontSize: 20,
  fontWeight: 900,
};

const cardSx = {
  borderRadius: `${designTokens.radius.xl}px`,
  p: { xs: 1.6, sm: 2 },
};
