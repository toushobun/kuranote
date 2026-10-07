"use client";

import { useMemo, useState } from "react";

import type { LedgerSetupDraft, LedgerSetupTemplate } from "internal/ledger";
import type {
  GroupedPresetChecklistGroup,
  GroupedPresetChecklistItem,
} from "molecules/ui/GroupedPresetChecklist/GroupedPresetChecklist";
import type { LedgerSetupWizardStepProps } from "organisms/ledgers/LedgerSetupWizard/ledgerSetupWizardStepTypes";
import { useLedgerSetupDraftSave } from "organisms/ledgers/LedgerSetupWizard/useLedgerSetupDraftSave";
import type { LedgerSetupProgress } from "types/ledgers";
import { getWebsiteDisplayDomain } from "utils/merchants";

/** 将模板转换为两层勾选的分组（商家标签，按 sortOrder）与项目（商家，副文字为官网域名）。 */
function buildMerchantChecklist(template: LedgerSetupTemplate) {
  const groups: GroupedPresetChecklistGroup[] = [...template.merchantTags]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((tag) => ({
      icon: tag.icon,
      itemKeys: template.merchants
        .filter(({ tagKeys }) => tagKeys.includes(tag.key))
        .map(({ key }) => key),
      key: tag.key,
      name: tag.name,
    }));
  const items: GroupedPresetChecklistItem[] = template.merchants.map(
    (merchant) => ({
      key: merchant.key,
      name: merchant.name,
      secondaryText: getWebsiteDisplayDomain(merchant.websiteUrl) ?? undefined,
    }),
  );

  return { groups, items };
}

type UseLedgerSetupMerchantsStepOptions = Omit<
  LedgerSetupWizardStepProps,
  "progress"
> & {
  progress: LedgerSetupProgress;
};

export function useLedgerSetupMerchantsStep(
  options: UseLedgerSetupMerchantsStepOptions,
) {
  const { progress } = options;
  const { draft } = progress.setup;
  const { template } = progress;
  const draftSave = useLedgerSetupDraftSave(options);
  // 初始勾选直接使用草稿（补全后的默认草稿已按默认勾选标签生成），前端不重新计算默认值。
  const [selectedKeys, setSelectedKeys] = useState<string[]>(() => [
    ...draft.merchants.selectedKeys,
  ]);
  const checklist = useMemo(
    () => (template ? buildMerchantChecklist(template) : null),
    [template],
  );

  // 勾选以商家为单位存储，多标签商家只算一次。
  const selectedCount = selectedKeys.length;
  const allSelected = !!checklist && selectedCount === checklist.items.length;

  function save(
    direction: "next" | "previous",
    merchants: LedgerSetupDraft["merchants"],
  ) {
    const nextDraft = { ...draft, merchants };
    return direction === "next"
      ? draftSave.saveAndGoNext(nextDraft)
      : draftSave.saveAndGoPrevious(nextDraft);
  }

  return {
    allSelected,
    checklist,
    failureState: draftSave.failureState,
    isSaving: draftSave.isSaving,
    selectedCount,
    selectedKeys,
    setSelectedKeys,
    // 没有模板时没有可选商家，下一步按跳过保存。
    goNext() {
      void save(
        "next",
        template
          ? { selectedKeys, skipped: false }
          : { selectedKeys: [], skipped: true },
      );
    },
    // 返回上一步时保留原有的跳过状态，只保存勾选的修改。
    goPrevious() {
      void save("previous", {
        selectedKeys,
        skipped: draft.merchants.skipped,
      });
    },
    // 跳过时保留当前勾选，返回该步骤时可以恢复；完成写入时不创建商家。
    skip() {
      void save("next", { selectedKeys, skipped: true });
    },
    toggleAll() {
      if (!checklist) return;
      setSelectedKeys(allSelected ? [] : checklist.items.map(({ key }) => key));
    },
  };
}
