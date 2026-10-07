import { ledgerSetupWizardMessages } from "config/ledgerSetupMessages";
import { EmptyState } from "molecules/ui/EmptyState";
import { WizardActionBar } from "molecules/ui/WizardActionBar/WizardActionBar";

import { LedgerSetupStepLayout } from "./LedgerSetupStepLayout";
import type { LedgerSetupWizardStepProps } from "./ledgerSetupWizardStepTypes";

/**
 * 尚未实现的步骤的占位内容（#395 实施拆分第 7 项替换）。
 * 目前只用于完成写入后的步骤：账本已完成，不能返回上一步，因此不显示「上一步」。
 */
export function LedgerSetupPlaceholderStep({
  isLastStep,
  onNext,
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
