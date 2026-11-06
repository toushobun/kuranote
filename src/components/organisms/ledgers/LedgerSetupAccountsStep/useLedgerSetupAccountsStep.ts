"use client";

import { useMemo, useState } from "react";

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
import { useLedgerSetupDraftSave } from "organisms/ledgers/LedgerSetupWizard/useLedgerSetupDraftSave";
import { useLedgerSetupStepDirty } from "organisms/ledgers/LedgerSetupWizard/useLedgerSetupStepDirty";
import type { LedgerSetupProgress } from "types/ledgers";

/** 同一类型内候选名称唯一，类型 + 名称作为勾选 key。 */
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

/** 模板候选 → 按地区、类型分组的勾选列表。两地都有的同名候选只列一次。 */
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

type UseLedgerSetupAccountsStepOptions = Omit<
  LedgerSetupWizardStepProps,
  "progress"
> & {
  progress: LedgerSetupProgress;
};

export function useLedgerSetupAccountsStep(
  options: UseLedgerSetupAccountsStepOptions,
) {
  const { progress } = options;
  const { draft } = progress.setup;
  const { template } = progress;
  const draftSave = useLedgerSetupDraftSave(options);
  const items = useMemo(
    () => (template ? buildAccountPresetItems(template) : []),
    [template],
  );
  // 草稿已在服务端按模板校正，只含模板候选。
  const [selectedKeys, setSelectedKeys] = useState<string[]>(() =>
    draft.accounts.items.map(getAccountKey),
  );
  useLedgerSetupStepDirty(
    { selectedKeys: [...selectedKeys].sort() },
    options.onDirtyChange,
  );
  const limitExceeded = selectedKeys.length > ledgerSetupLimits.maxAccounts;

  function buildDraft(skipped: boolean) {
    const selected = new Set(selectedKeys);
    return {
      ...draft,
      accounts: {
        items: items
          .filter(({ key }) => selected.has(key))
          .map(({ account }) => account),
        skipped,
      },
    };
  }

  return {
    checkedCount: selectedKeys.length,
    failureState: draftSave.failureState,
    isSaving: draftSave.isSaving,
    items,
    limitExceeded,
    selectedKeys,
    setSelectedKeys,
    goNext() {
      void draftSave.saveAndGoNext(buildDraft(false));
    },
    // 返回上一步时保留原有的跳过状态，只保存账户的修改。
    goPrevious() {
      void draftSave.saveAndGoPrevious(buildDraft(draft.accounts.skipped));
    },
  };
}
