"use client";

import { useEffect, useState } from "react";

import {
  createDefaultLedgerSetupDraft,
  getLedgerSetupRegionFromTimeZone,
  getLedgerSetupTemplate,
  type LedgerSetup,
} from "internal/ledger";
import type { LedgerBasicInfoValues } from "organisms/ledgers/LedgerBasicInfoFields/LedgerBasicInfoFields";
import type { LedgerSetupProgress } from "types/ledgers";
import { buildLedgerSetupConfirmSummary } from "utils/ledgerSetupSummary";

import {
  ledgerSetupLastDraftStep,
  ledgerSetupWizardSteps,
} from "./ledgerSetupWizardSteps";
import type { LedgerSetupCompletion } from "./ledgerSetupWizardStepTypes";

const stepCount = ledgerSetupWizardSteps.length;

function clampStep(step: number) {
  return Math.min(Math.max(step, 1), stepCount);
}

function createNewProgress(defaults: LedgerBasicInfoValues): LedgerSetupProgress {
  const livingRegion = getLedgerSetupRegionFromTimeZone(
    Intl.DateTimeFormat().resolvedOptions().timeZone,
  );
  return {
    setup: {
      baseCurrency: defaults.baseCurrency,
      displayColor: defaults.displayColor,
      displayName: defaults.displayName,
      draft: createDefaultLedgerSetupDraft(livingRegion),
      id: "",
      livingRegion,
      name: defaults.ledgerName,
      step: 1,
      updatedAt: null,
    },
    template: getLedgerSetupTemplate(livingRegion),
  };
}

function snapshotOf(setup: LedgerSetup) {
  return JSON.stringify({
    baseCurrency: setup.baseCurrency,
    displayColor: setup.displayColor,
    displayName: setup.displayName,
    draft: setup.draft,
    livingRegion: setup.livingRegion,
    name: setup.name,
  });
}

export type LedgerSetupWizardNotice = "draft" | "templateUpdated";

type UseLedgerSetupWizardOptions = {
  defaults: LedgerBasicInfoValues;
  initialNotice?: LedgerSetupWizardNotice | null;
  initialProgress: LedgerSetupProgress | null;
};

export function useLedgerSetupWizard({
  defaults,
  initialNotice = null,
  initialProgress,
}: UseLedgerSetupWizardOptions) {
  // 编辑期间只有此处持有完整草稿；持久化快照仅用于比较与乐观锁。
  const [progress, setProgress] = useState<LedgerSetupProgress>(
    () => initialProgress ?? createNewProgress(defaults),
  );
  const [savedProgress, setSavedProgress] = useState(initialProgress);
  const [step, setStep] = useState(() =>
    initialProgress ? clampStep(initialProgress.setup.step) : 1,
  );
  const [progressRevision, setProgressRevision] = useState(0);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(initialNotice);
  const [completion, setCompletion] = useState<LedgerSetupCompletion | null>(null);
  const [completeScreen, setCompleteScreen] = useState<
    (LedgerSetupCompletion & { placeholderMemberCount: number }) | null
  >(null);

  useEffect(() => {
    // 客户端生成一次提交 ID；不在服务端渲染期间产生不稳定 UUID。
    if (progress.setup.id) return;
    setProgress((current) => ({
      ...current,
      setup: { ...current.setup, id: crypto.randomUUID() },
    }));
  }, [progress.setup.id]);

  const dirty =
    !savedProgress ||
    snapshotOf(progress.setup) !== snapshotOf(savedProgress.setup);

  function markSetupCompleted() {
    const summary = buildLedgerSetupConfirmSummary(progress);
    setCompletion({
      accountCount: summary.accounts.names.length,
      ledgerName: summary.basicInfo.ledgerName,
      merchantCount: summary.merchants.count,
    });
    setNotice(null);
    setStep(ledgerSetupLastDraftStep + 1);
  }

  return {
    busy,
    completeScreen,
    currentStep: ledgerSetupWizardSteps[step - 1],
    dirty,
    notice,
    progress,
    progressRevision,
    savedProgress,
    step,
    dismissNotice() {
      setNotice(null);
    },
    finish(placeholderMemberCount: number) {
      if (!completion) return;
      setCompleteScreen({ ...completion, placeholderMemberCount });
    },
    goNext() {
      setStep((current) => clampStep(current + 1));
    },
    goToStep(target: number) {
      if (
        !Number.isInteger(target) ||
        target < 1 ||
        target >= ledgerSetupLastDraftStep
      ) return;
      setStep(target);
    },
    markSetupCompleted,
    goPrevious() {
      setStep((current) => clampStep(current - 1));
    },
    goToBasicInfo() {
      setStep(1);
    },
    // 本地内容更新不会重置当前步骤的 UI 状态。
    updateProgress: setProgress,
    resetDraft() {
      setSavedProgress(null);
      setProgress(createNewProgress(defaults));
      setProgressRevision((value) => value + 1);
      setStep(1);
      setNotice(null);
    },
    setBusy,
  };
}
