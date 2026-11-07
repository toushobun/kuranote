"use client";

import { useMemo } from "react";

import {
  ledgerSetupAccountTypes,
  ledgerSetupLimits,
  ledgerSetupRegions,
  type LedgerSetupAccountType,
  type LedgerSetupDraftAccount,
  type LedgerSetupRegion,
  type LedgerSetupTemplate,
} from "internal/ledger";
import type { LedgerSetupWizardStepProps } from "organisms/ledgers/LedgerSetupWizard/ledgerSetupWizardStepTypes";
import type { LedgerSetupProgress } from "types/ledgers";

function getAccountKey({
  name,
  type,
}: {
  name: string;
  type: LedgerSetupAccountType;
}) {
  return `${type}:${name}`;
}

type AccountPresetItem = {
  account: LedgerSetupDraftAccount;
  key: string;
  name: string;
  regions: LedgerSetupRegion[];
};

function buildAccountPresetItems(template: LedgerSetupTemplate) {
  const items = new Map<string, AccountPresetItem>();
  for (const region of ledgerSetupRegions) {
    for (const type of ledgerSetupAccountTypes) {
      for (const name of template.accountCandidatesByRegion[region][type]) {
        const key = getAccountKey({ name, type });
        const existing = items.get(key);
        if (existing) {
          existing.regions.push(region);
        } else {
          items.set(key, {
            account: { name, templateKey: name, type },
            key,
            name,
            regions: [region],
          });
        }
      }
    }
  }
  return [...items.values()];
}

type Options = Omit<LedgerSetupWizardStepProps, "progress"> & {
  progress: LedgerSetupProgress;
};

export function useLedgerSetupAccountsStep({
  onNext,
  onPrevious,
  onProgressChange,
  progress,
}: Options) {
  const { draft } = progress.setup;
  const items = useMemo(
    () => (progress.template ? buildAccountPresetItems(progress.template) : []),
    [progress.template],
  );
  const selectedKeys = draft.accounts.items.map(getAccountKey);

  function setSelectedKeys(keys: string[]) {
    const selected = new Set(keys);
    onProgressChange({
      ...progress,
      setup: {
        ...progress.setup,
        draft: {
          ...draft,
          accounts: {
            items: items
              .filter(({ key }) => selected.has(key))
              .map(({ account }) => account),
            skipped: false,
          },
        },
      },
    });
  }

  return {
    checkedCount: selectedKeys.length,
    failureState: {},
    isSaving: false,
    items,
    limitExceeded: selectedKeys.length > ledgerSetupLimits.maxAccounts,
    selectedKeys,
    setSelectedKeys,
    goNext() {
      onNext();
    },
    goPrevious() {
      onPrevious();
    },
  };
}
