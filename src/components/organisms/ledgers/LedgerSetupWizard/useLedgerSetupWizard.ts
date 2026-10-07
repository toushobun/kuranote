"use client";

import { useState } from "react";

import { ledgerSetupWizardMessages } from "config/ledgerSetupMessages";
import {
  ledgerSetupErrorCodes,
  ledgerSetupErrorMessages,
} from "internal/ledger";
import type { LedgerSetupProgress } from "types/ledgers";

import {
  ledgerSetupLastDraftStep,
  ledgerSetupWizardSteps,
} from "./ledgerSetupWizardSteps";

const stepCount = ledgerSetupWizardSteps.length;

function clampStep(step: number) {
  return Math.min(Math.max(step, 1), stepCount);
}

/** 恢复到创建中账本上次的步骤；尚未创建时从第 1 步开始。 */
function getResumeStep(progress: LedgerSetupProgress | null) {
  return progress ? clampStep(progress.setup.step) : 1;
}

type UseLedgerSetupWizardOptions = {
  initialProgress: LedgerSetupProgress | null;
  onClose: () => void;
};

export function useLedgerSetupWizard({
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
  // 向导顶部的提示：恢复到其他创建中账本时说明本次填写的内容未保存，
  // 预设内容已更新时说明需要重新确认。
  const [notice, setNotice] = useState<string | null>(null);

  // 账本已创建（创建中）且尚未完成写入时，进度已保存在服务端，关闭前提示可稍后继续。
  const needsCloseConfirm =
    progress !== null && step <= ledgerSetupLastDraftStep;

  return {
    busy,
    closeConfirmOpen,
    currentStep: ledgerSetupWizardSteps[step - 1],
    isLastStep: step === stepCount,
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
    goNext() {
      setStep((current) => clampStep(current + 1));
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
