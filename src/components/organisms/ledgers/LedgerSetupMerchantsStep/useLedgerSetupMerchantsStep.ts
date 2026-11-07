"use client";

import { useMemo } from "react";

import type { LedgerSetupDraft, LedgerSetupRegion } from "internal/ledger";
import type { LedgerSetupWizardStepProps } from "organisms/ledgers/LedgerSetupWizard/ledgerSetupWizardStepTypes";
import { buildMerchantChecklist } from "utils/merchantPresets";

export function useLedgerSetupMerchantsStep({
  onNext,
  onProgressChange,
  progress,
}: LedgerSetupWizardStepProps) {
  const { draft } = progress.setup;
  const selectedKeys = draft.merchants.selectedKeys;
  const additionalRegions = draft.merchants.additionalRegions ?? [];
  const checklist = useMemo(
    () =>
      progress.template ? buildMerchantChecklist(progress.template) : null,
    [progress.template],
  );

  function update(merchants: LedgerSetupDraft["merchants"]) {
    onProgressChange({
      ...progress,
      setup: {
        ...progress.setup,
        draft: { ...draft, merchants },
      },
    });
  }

  return {
    checklist,
    selectedCount: selectedKeys.length,
    selectedKeys,
    setSelectedKeys(keys: string[]) {
      update({ ...draft.merchants, selectedKeys: keys, skipped: false });
    },
    additionalRegions,
    setAdditionalRegions(regions: LedgerSetupRegion[]) {
      update({ ...draft.merchants, additionalRegions: regions });
    },
    goNext() {
      if (!progress.template) {
        update({ ...draft.merchants, selectedKeys: [], skipped: true });
      }
      onNext();
    },
  };
}
