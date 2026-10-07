import { ledgerSetupWizardMessages } from "config/ledgerSetupMessages";
import { EmptyState } from "molecules/ui/EmptyState";
import { WizardActionBar } from "molecules/ui/WizardActionBar/WizardActionBar";

import { LedgerSetupStepLayout } from "./LedgerSetupStepLayout";
import type { LedgerSetupWizardStepProps } from "./ledgerSetupWizardStepTypes";

/** 尚未实现的步骤的占位内容（#395 实施拆分第 6～7 项替换）。 */
export function LedgerSetupPlaceholderStep({
  isLastStep,
  onNext,
  onPrevious,
  stepLabel,
}: LedgerSetupWizardStepProps) {
  return (
    <LedgerSetupStepLayout
      actions={
        <WizardActionBar
          next={{
            disabled: isLastStep,
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
      <EmptyState
        description={ledgerSetupWizardMessages.placeholder}
        title={stepLabel}
      />
    </LedgerSetupStepLayout>
  );
}
