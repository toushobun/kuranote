"use client";

import { useMemo } from "react";

import type { LedgerSetupDraft, LedgerSetupRegion } from "internal/ledger";
import type { LedgerSetupWizardStepProps } from "organisms/ledgers/LedgerSetupWizard/ledgerSetupWizardStepTypes";
import type { LedgerSetupProgress } from "types/ledgers";
import { buildMerchantChecklist } from "utils/merchantPresets";

type Options = Omit<LedgerSetupWizardStepProps, "progress"> & {
  progress: LedgerSetupProgress;
};

export function useLedgerSetupMerchantsStep({
  onNext,
  onPrevious,
  onProgressChange,
  progress,
}: Options) {
  const { draft } = progress.setup;
  const selectedKeys = draft.merchants.selectedKeys;
  const additionalRegions = draft.merchants.additionalRegions ?? [];
  const checklist = useMemo(
    () => progress.template ? buildMerchantChecklist(progress.template) : null,
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
    failureState: {},
    isSaving: false,
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
    goPrevious() {
      onPrevious();
    },
  };
}
