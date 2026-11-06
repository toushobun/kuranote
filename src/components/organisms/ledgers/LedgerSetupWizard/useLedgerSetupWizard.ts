"use client";

import { useState } from "react";

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

/** 恢复到创建中账本上次的步骤；尚未创建时从第 1 步开始。 */
function getResumeStep(progress: LedgerSetupProgress | null) {
  return progress ? clampStep(progress.setup.step) : 1;
}

export type LedgerSetupWizardNotice = "draft" | "templateUpdated";

type UseLedgerSetupWizardOptions = {
  initialNotice?: LedgerSetupWizardNotice | null;
  initialProgress: LedgerSetupProgress | null;
};

export function useLedgerSetupWizard({
  initialNotice = null,
  initialProgress,
}: UseLedgerSetupWizardOptions) {
  const [restarted, setRestarted] = useState(false);
  const [progress, setProgress] = useState(initialProgress);
  const [step, setStep] = useState(() => getResumeStep(initialProgress));
  // 进度被服务端重新读取的内容替换时递增，使当前步骤按新进度重新初始化。
  const [progressRevision, setProgressRevision] = useState(0);
  // 步骤保存中：锁定「×」与关闭，避免保存过程中关闭向导。
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(initialNotice);
  // 完成写入成功时保存的完成页统计；完成后草稿已过期，不再从进度计算。
  const [completion, setCompletion] = useState<LedgerSetupCompletion | null>(
    null,
  );
  // 第 6 步「完成」后显示完成页（不属于步骤注册表，不计入进度条）。
  const [completeScreen, setCompleteScreen] = useState<
    (LedgerSetupCompletion & { placeholderMemberCount: number }) | null
  >(null);

  return {
    busy,
    completeScreen,
    currentStep: ledgerSetupWizardSteps[step - 1],
    notice,
    progress,
    progressRevision,
    restarted,
    step,
    dismissNotice() {
      setNotice(null);
    },
    finish(placeholderMemberCount: number) {
      // 第 6 步只会在完成写入成功（已保存统计）后进入。
      if (!completion) return;
      setCompleteScreen({ ...completion, placeholderMemberCount });
    },
    goNext() {
      setStep((current) => clampStep(current + 1));
    },
    // 只允许跳到完成写入前可编辑的步骤（确认一览之前），不跳到确认一览自身或完成后的步骤。
    goToStep(target: number) {
      if (
        !Number.isInteger(target) ||
        target < 1 ||
        target >= ledgerSetupLastDraftStep
      ) {
        return;
      }
      setStep(target);
    },
    markSetupCompleted() {
      if (!progress) return;
      // 账户数、商家数与确认一览使用同一份汇总，保证两处数字一致。
      const summary = buildLedgerSetupConfirmSummary(progress);
      setCompletion({
        accountCount: summary.accounts.names.length,
        ledgerName: summary.basicInfo.ledgerName,
        merchantCount: summary.merchants.count,
      });
      setNotice((current) => (current === "draft" ? null : current));
      setStep(ledgerSetupLastDraftStep + 1);
    },
    goPrevious() {
      setStep((current) => clampStep(current - 1));
    },
    refreshProgress(nextProgress: LedgerSetupProgress) {
      setProgress(nextProgress);
      setProgressRevision((current) => current + 1);
      setNotice("templateUpdated");
    },
    restoreProgress(nextProgress: LedgerSetupProgress) {
      setProgress(nextProgress);
      setStep(getResumeStep(nextProgress));
      setNotice("draft");
    },
    resetDraft() {
      setRestarted(true);
      setProgress(null);
      setStep(1);
      setNotice(null);
    },
    setBusy,
    updateProgress: setProgress,
  };
}
