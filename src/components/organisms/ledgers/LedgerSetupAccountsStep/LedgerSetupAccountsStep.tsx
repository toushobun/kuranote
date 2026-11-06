"use client";

import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { AccountTypeIcon } from "atoms/accounts/AccountTypeIcon/AccountTypeIcon";
import {
  ledgerSetupAccountsMessages,
  ledgerSetupWizardMessages,
} from "config/ledgerSetupMessages";
import { regionPresetMessages } from "config/regionPresetMessages";
import { ledgerSetupAccountTypes, ledgerSetupLimits } from "internal/ledger";
import { ActionFailureFeedback } from "molecules/ui/OperationFeedbackDialogs";
import { RegionPresetSelector } from "molecules/ui/RegionPresetSelector/RegionPresetSelector";
import { WizardActionBar } from "molecules/ui/WizardActionBar/WizardActionBar";
import { WizardStepLayout } from "molecules/ui/WizardDialog/WizardStepLayout";
import type { LedgerSetupWizardStepProps } from "organisms/ledgers/LedgerSetupWizard/ledgerSetupWizardStepTypes";
import { typographyStyles } from "theme/typographyTokens";
import type { LedgerSetupProgress } from "types/ledgers";
import { getAccountTypeLabel } from "utils/accounts";

import { useLedgerSetupAccountsStep } from "./useLedgerSetupAccountsStep";

const selectorMessages = {
  checklist: ledgerSetupAccountsMessages.checklist,
  selectedCount: regionPresetMessages.accountSelectedCount,
  title: regionPresetMessages.accountGroup,
};

/**
 * 向导第 2 步「账户」：与商家步骤相同，按地区分卡、卡内按账户类型分组勾选模板候选。
 * 不能在此自行添加账户（之后在账户管理中添加）。第 2 步只能在第 1 步创建账本后进入，因此始终有进度。
 */
export function LedgerSetupAccountsStep({
  progress,
  ...props
}: LedgerSetupWizardStepProps) {
  if (!progress) return null;

  return <LedgerSetupAccountsStepContent {...props} progress={progress} />;
}

function LedgerSetupAccountsStepContent(
  props: Omit<LedgerSetupWizardStepProps, "progress"> & {
    progress: LedgerSetupProgress;
  },
) {
  const step = useLedgerSetupAccountsStep(props);
  const groups = ledgerSetupAccountTypes.map((type) => ({
    icon: <AccountTypeIcon type={type} />,
    itemKeys: step.items
      .filter(({ account }) => account.type === type)
      .map(({ key }) => key),
    key: type,
    name: getAccountTypeLabel(type),
  }));

  return (
    <WizardStepLayout
      actions={
        <WizardActionBar
          next={{
            disabled: step.limitExceeded,
            label:
              step.checkedCount > 0
                ? ledgerSetupAccountsMessages.nextWithCount(step.checkedCount)
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
        />
      }
    >
      <Stack spacing={1}>
        <Stack spacing={0.75}>
          <Typography component="h3" sx={titleSx}>
            {ledgerSetupAccountsMessages.title}
          </Typography>
          <Typography color="textSecondary" variant="body2">
            {ledgerSetupAccountsMessages.description}
          </Typography>
          {step.limitExceeded ? (
            <Typography color="warning" role="status" variant="body2">
              {ledgerSetupAccountsMessages.limitReached(
                ledgerSetupLimits.maxAccounts,
              )}
            </Typography>
          ) : null}
        </Stack>

        <RegionPresetSelector
          disabled={step.isSaving}
          groups={groups}
          items={step.items}
          messages={selectorMessages}
          onChange={step.setSelectedKeys}
          region={props.progress.setup.livingRegion}
          selectedKeys={step.selectedKeys}
        />
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
