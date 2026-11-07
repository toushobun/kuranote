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
import { RegionPresetSelector } from "molecules/ui/RegionPresetSelector/RegionPresetSelector";
import { WizardActionBar } from "molecules/ui/WizardActionBar/WizardActionBar";
import { WizardStepLayout } from "molecules/ui/WizardDialog/WizardStepLayout";
import type { LedgerSetupWizardStepProps } from "organisms/ledgers/LedgerSetupWizard/ledgerSetupWizardStepTypes";
import { typographyStyles } from "theme/typographyTokens";
import { getAccountTypeLabel } from "utils/accounts";

import { useLedgerSetupAccountsStep } from "./useLedgerSetupAccountsStep";

const selectorMessages = {
  checklist: ledgerSetupAccountsMessages.checklist,
  selectedCount: regionPresetMessages.accountSelectedCount,
  title: regionPresetMessages.accountGroup,
};

/**
 * 向导第 2 步「账户」：与商家步骤相同，按地区分卡、卡内按账户类型分组勾选模板候选。
 * 自定义账户在账本创建后通过账户管理添加。
 */
export function LedgerSetupAccountsStep(props: LedgerSetupWizardStepProps) {
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
            onClick: props.onNext,
          }}
          previous={{
            disabled: step.limitExceeded,
            label: ledgerSetupWizardMessages.previous,
            onClick: props.onPrevious,
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
          groups={groups}
          items={step.items}
          messages={selectorMessages}
          onChange={step.setSelectedKeys}
          region={props.progress.setup.livingRegion}
          selectedKeys={step.selectedKeys}
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
