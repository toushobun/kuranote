"use client";

import { useState, type FormEvent } from "react";

import {
  createDefaultLedgerSetupDraft,
  getLedgerSetupTemplate,
  isLedgerCurrency,
  ledgerCreateErrorMessages,
  ledgerSetupErrorMessages,
  validateLedgerSetupBasicInfoForm,
  type LedgerSetupRegion,
} from "internal/ledger";
import type { LedgerSetupWizardStepProps } from "organisms/ledgers/LedgerSetupWizard/ledgerSetupWizardStepTypes";
import type { LedgerBasicInfoValues } from "organisms/ledgers/LedgerBasicInfoFields/LedgerBasicInfoFields";

export function useLedgerSetupBasicInfoStep({
  onNext,
  onProgressChange,
  progress,
  validationError,
}: LedgerSetupWizardStepProps) {
  const [failure, setFailure] = useState<string | null>(null);
  const { setup } = progress;
  const values: LedgerBasicInfoValues = {
    baseCurrency: setup.baseCurrency,
    displayColor: setup.displayColor,
    displayName: setup.displayName,
    ledgerName: setup.name,
  };

  function setValues(next: LedgerBasicInfoValues) {
    if (!isLedgerCurrency(next.baseCurrency)) return;
    onProgressChange({
      ...progress,
      setup: {
        ...progress.setup,
        baseCurrency: next.baseCurrency,
        displayColor: next.displayColor,
        displayName: next.displayName,
        name: next.ledgerName,
      },
    });
  }

  function setLivingRegion(region: LedgerSetupRegion | null) {
    const changed = progress.setup.livingRegion !== region;
    onProgressChange({
      ...progress,
      setup: {
        ...progress.setup,
        livingRegion: region,
        draft: changed
          ? createDefaultLedgerSetupDraft(region)
          : progress.setup.draft,
      },
      template: getLedgerSetupTemplate(region),
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validated = validateLedgerSetupBasicInfoForm(
      new FormData(event.currentTarget),
    );
    if (!validated.ok) {
      const messages = {
        ...ledgerCreateErrorMessages,
        ...ledgerSetupErrorMessages,
      };
      setFailure(messages[validated.error]);
      return;
    }
    setFailure(null);
    onNext();
  }

  return {
    actionState:
      failure || validationError
        ? { error: failure ?? validationError ?? undefined }
        : {},
    handleSubmit,
    ledgerId: setup.id,
    setValues,
    values,
    livingRegion: setup.livingRegion,
    setLivingRegion,
  };
}
