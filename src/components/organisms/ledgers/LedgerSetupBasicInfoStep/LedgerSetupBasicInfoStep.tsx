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
import { LedgerSetupStepLayout } from "organisms/ledgers/LedgerSetupWizard/LedgerSetupStepLayout";
import type { LedgerSetupWizardStepProps } from "organisms/ledgers/LedgerSetupWizard/ledgerSetupWizardStepTypes";
import { designTokens } from "theme/theme";
import { typographyStyles } from "theme/typographyTokens";

import { useLedgerSetupBasicInfoStep } from "./useLedgerSetupBasicInfoStep";

const formId = "ledger-setup-basic-info-form";

/**
 * 向导第 1 步「基本信息」。尚无创建中账本时提交即创建账本（创建中），
 * 已有时更新基本信息；成功后进入下一步。
 */
export function LedgerSetupBasicInfoStep(props: LedgerSetupWizardStepProps) {
  const { actionState, handleSubmit, isPending, ledgerId, setValues, values } =
    useLedgerSetupBasicInfoStep(props);

  return (
    <LedgerSetupStepLayout
      actions={
        <WizardActionBar
          next={{
            form: formId,
            label: ledgerSetupWizardMessages.next,
            loading: isPending,
            loadingLabel: ledgerSetupWizardMessages.submitting,
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
          <Typography color="text.secondary" variant="body2">
            {ledgerSetupBasicInfoMessages.description}
          </Typography>
        </Stack>
        <SoftCard sx={cardSx}>
          <LedgerBasicInfoFields onChange={setValues} values={values} />
        </SoftCard>
      </Stack>

      <ActionFailureFeedback
        state={actionState}
        title={ledgerSetupBasicInfoMessages.errorTitle}
      />
    </LedgerSetupStepLayout>
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
