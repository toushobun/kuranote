"use client";

import { useState } from "react";

import { ledgerSetupWizardMessages } from "config/ledgerSetupMessages";
import {
  ledgerSetupErrorCodes,
  ledgerSetupErrorMessages,
} from "internal/ledger";
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

type UseLedgerSetupWizardOptions = {
  initialNotice?: string | null;
  initialProgress: LedgerSetupProgress | null;
  onClose: () => void;
};

export function useLedgerSetupWizard({
  initialNotice = null,
  initialProgress,
  onClose,
}: UseLedgerSetupWizardOptions) {
  const [progress, setProgress] = useState(initialProgress);
  const [step, setStep] = useState(() => getResumeStep(initialProgress));
  // 进度被服务端重新读取的内容替换时递增，使当前步骤按新进度重新初始化。
  const [progressRevision, setProgressRevision] = useState(0);
  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false);
  // 步骤保存中：锁定「×」与关闭，避免保存过程中关闭向导。
  const [busy, setBusy] = useState(false);
  // 向导顶部的提示：打开时已有创建中账本、恢复到其他创建中账本时说明本次填写的内容未保存，
  // 预设内容已更新时说明需要重新确认。
  const [notice, setNotice] = useState<string | null>(initialNotice);
  // 创建中账本已在其他页面完成或不存在：没有可稍后继续的进度。
  const [setupUnavailable, setSetupUnavailable] = useState(false);
  // 完成写入成功时保存的完成页统计；完成后草稿已过期，不再从进度计算。
  const [completion, setCompletion] = useState<LedgerSetupCompletion | null>(
    null,
  );
  // 第 6 步「完成」后显示完成页（不属于步骤注册表，不计入进度条）。
  const [completeScreen, setCompleteScreen] = useState<
    (LedgerSetupCompletion & { placeholderMemberCount: number }) | null
  >(null);

  // 账本已创建（创建中）且尚未完成写入时，进度已保存在服务端，关闭前提示可稍后继续。
  const needsCloseConfirm =
    progress !== null && !setupUnavailable && step <= ledgerSetupLastDraftStep;

  return {
    busy,
    closeConfirmOpen,
    completeScreen,
    currentStep: ledgerSetupWizardSteps[step - 1],
    notice,
    progress,
    progressRevision,
    step,
    closeLater() {
      setCloseConfirmOpen(false);
      onClose();
    },
    continueSetup() {
      setCloseConfirmOpen(false);
    },
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
      setStep(ledgerSetupLastDraftStep + 1);
    },
    markSetupUnavailable() {
      setSetupUnavailable(true);
    },
    goPrevious() {
      setStep((current) => clampStep(current - 1));
    },
    refreshProgress(nextProgress: LedgerSetupProgress) {
      setProgress(nextProgress);
      setProgressRevision((current) => current + 1);
      setNotice(ledgerSetupWizardMessages.templateUpdatedNotice);
    },
    requestClose() {
      if (busy) return;

      if (needsCloseConfirm) {
        setCloseConfirmOpen(true);
        return;
      }

      onClose();
    },
    restoreProgress(nextProgress: LedgerSetupProgress) {
      setProgress(nextProgress);
      setStep(getResumeStep(nextProgress));
      setNotice(
        ledgerSetupErrorMessages[ledgerSetupErrorCodes.inProgressExists],
      );
    },
    setBusy,
    updateProgress: setProgress,
  };
}
