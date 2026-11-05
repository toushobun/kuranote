"use client";

import { useLedgerSetupStepDirty } from "organisms/ledgers/LedgerSetupWizard/useLedgerSetupStepDirty";

import { useMemo, useState, useRef } from "react";

import type { LedgerSetupDraft } from "internal/ledger";
import type { LedgerSetupWizardStepProps } from "organisms/ledgers/LedgerSetupWizard/ledgerSetupWizardStepTypes";
import { useLedgerSetupDraftSave } from "organisms/ledgers/LedgerSetupWizard/useLedgerSetupDraftSave";
import type { LedgerSetupProgress } from "types/ledgers";
import { buildMerchantChecklist } from "utils/merchantPresets";

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
  const changingRegion = useRef(false);
  const draftSave = useLedgerSetupDraftSave({
    ...options,
    onPrevious: () =>
      changingRegion.current ? options.onGoToStep(1) : options.onPrevious(),
  });
  const [additionalRegions, setAdditionalRegions] = useState(
    draft.merchants.additionalRegions ?? [],
  );
  // 初始勾选直接使用草稿（补全后的默认草稿已按默认勾选标签生成），前端不重新计算默认值。
  const [selectedKeys, setSelectedKeys] = useState<string[]>(() => [
    ...draft.merchants.selectedKeys,
  ]);
  useLedgerSetupStepDirty(
    { selectedKeys: [...selectedKeys].sort(), additionalRegions },
    options.onDirtyChange,
  );
  const checklist = useMemo(
    () => (template ? buildMerchantChecklist(template) : null),
    [template],
  );

  // 勾选以商家为单位存储，多标签商家只算一次。
  const selectedCount = selectedKeys.length;

  function save(
    direction: "next" | "previous",
    merchants: LedgerSetupDraft["merchants"],
  ) {
    const nextDraft = {
      ...draft,
      merchants: {
        ...merchants,
        ...(additionalRegions.length ? { additionalRegions } : {}),
      },
    };
    return direction === "next"
      ? draftSave.saveAndGoNext(nextDraft)
      : draftSave.saveAndGoPrevious(nextDraft);
  }

  return {
    checklist,
    failureState: draftSave.failureState,
    isSaving: draftSave.isSaving,
    selectedCount,
    selectedKeys,
    setSelectedKeys,
    additionalRegions,
    setAdditionalRegions,
    changeRegion() {
      changingRegion.current = true;
      void save("previous", { selectedKeys, skipped: draft.merchants.skipped });
    },
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
      changingRegion.current = false;
      void save("previous", {
        selectedKeys,
        skipped: draft.merchants.skipped,
      });
    },
    // 跳过时保留当前勾选，返回该步骤时可以恢复；完成写入时不创建商家。
    skip() {
      void save("next", { selectedKeys, skipped: true });
    },
  };
}
