import { ledgerSetupWizardMessages } from "config/ledgerSetupMessages";
import { LedgerSetupBasicInfoStep } from "organisms/ledgers/LedgerSetupBasicInfoStep/LedgerSetupBasicInfoStep";

import { LedgerSetupPlaceholderStep } from "./LedgerSetupPlaceholderStep";
import type { LedgerSetupWizardStepDefinition } from "./ledgerSetupWizardStepTypes";

const stepLabels = ledgerSetupWizardMessages.steps;

/**
 * 向导步骤注册表，顺序即步骤顺序。实现新的步骤时只替换对应的 Component。
 * 第 1～5 步与 ledger.setup_step（1～5）一一对应。
 */
export const ledgerSetupWizardSteps: readonly LedgerSetupWizardStepDefinition[] =
  [
    {
      Component: LedgerSetupBasicInfoStep,
      key: "basicInfo",
      label: stepLabels.basicInfo,
    },
    {
      Component: LedgerSetupPlaceholderStep,
      key: "accounts",
      label: stepLabels.accounts,
    },
    {
      Component: LedgerSetupPlaceholderStep,
      key: "merchants",
      label: stepLabels.merchants,
    },
    {
      Component: LedgerSetupPlaceholderStep,
      key: "features",
      label: stepLabels.features,
    },
    {
      Component: LedgerSetupPlaceholderStep,
      key: "confirm",
      label: stepLabels.confirm,
    },
    {
      Component: LedgerSetupPlaceholderStep,
      key: "invite",
      label: stepLabels.invite,
    },
  ];

/** 账本完成写入前的最后一步（确认一览）。此后账本已完成，关闭向导无需确认。 */
export const ledgerSetupLastDraftStep = 5;
