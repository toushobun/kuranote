"use client";

import { useState } from "react";

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
  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false);
  // 提交第 1 步时发现已有其他创建中账本、向导切换到该账本后，提示用户本次填写的内容未保存。
  const [restoredNoticeOpen, setRestoredNoticeOpen] = useState(false);

  // 账本已创建（创建中）且尚未完成写入时，进度已保存在服务端，关闭前提示可稍后继续。
  const needsCloseConfirm =
    progress !== null && step <= ledgerSetupLastDraftStep;

  return {
    closeConfirmOpen,
    currentStep: ledgerSetupWizardSteps[step - 1],
    isLastStep: step === stepCount,
    progress,
    restoredNoticeOpen,
    step,
    closeLater() {
      setCloseConfirmOpen(false);
      onClose();
    },
    continueSetup() {
      setCloseConfirmOpen(false);
    },
    dismissRestoredNotice() {
      setRestoredNoticeOpen(false);
    },
    goNext() {
      setStep((current) => clampStep(current + 1));
    },
    goPrevious() {
      setStep((current) => clampStep(current - 1));
    },
    requestClose() {
      if (needsCloseConfirm) {
        setCloseConfirmOpen(true);
        return;
      }

      onClose();
    },
    restoreProgress(nextProgress: LedgerSetupProgress) {
      setProgress(nextProgress);
      setStep(getResumeStep(nextProgress));
      setRestoredNoticeOpen(true);
    },
    updateProgress: setProgress,
  };
}
